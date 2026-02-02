/* eslint-disable */
// Colorgorical API Proxy Server
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

// Colorgorical API URL
const COLORGORICAL_API = process.env.COLORGORICAL_API || 'http://localhost:8888/api/makePaletteCandidates';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', colorgoricalApi: COLORGORICAL_API });
});

// Convert hex to RGB
function hexToRgb(hex) {
  const hexClean = hex.replace('#', '');
  return [
    parseInt(hexClean.substring(0, 2), 16),
    parseInt(hexClean.substring(2, 4), 16),
    parseInt(hexClean.substring(4, 6), 16)
  ];
}

// Convert RGB to LAB using simple approximation
function rgbToLab(rgb) {
  // D65 whitepoint
  const D65_X = 0.95047;
  const D65_Y = 1.0;
  const D65_Z = 1.08883;

  // sRGB -> linear RGB (gamma correction)
  const convert = (v) => (v <= 0.00304 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = convert(rgb[0] / 255.0);
  const g = convert(rgb[1] / 255.0);
  const b = convert(rgb[2] / 255.0);

  // linear RGB -> XYZ (then normalize by D65)
  let x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / D65_X;
  let y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / D65_Y;
  let z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / D65_Z;

  // XYZ -> Lab
  x = x > 0.008856 ? Math.pow(x, 1.0 / 3) : 7.787037 * x + 4.0 / 29;
  y = y > 0.008856 ? Math.pow(y, 1.0 / 3) : 7.787037 * y + 4.0 / 29;
  z = z > 0.008856 ? Math.pow(z, 1.0 / 3) : 7.787037 * z + 4.0 / 29;

  const L = 116 * y - 16;
  const A = 500 * (x - y);
  const B = 200 * (y - z);

  return [L, A, B];
}

// function round5(x) { return 5 * Math.round(x / 5); }

// Convert hex to LAB
function hexToLab(hex) {
  const rgb = hexToRgb(hex);
  return rgbToLab(rgb);
}

// LAB to LCh (L*, c*, h° in [0,360))
function labToLch([L, a, b]) {
  const c = Math.hypot(a, b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [L, c, h];
}

// smallest circular hue distance in degrees
function hueDistDeg(h1, h2) {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

// Map an LCh color to a global sector index based on deltaH & deltaR
function getSectorKey([L, c, h], deltaH, deltaR) {
  // deltaR is used as bin size for both L* and c*
  const binL = Math.floor(L / deltaR);
  const binC = Math.floor(c / deltaR);
  const binH = Math.floor(h / deltaH);
  return `${binL}|${binC}|${binH}`;
}

/**
 * Generate alternative colors for a selected palette color
 * 
 * POST /api/color-alternatives
 * Body: {
 *   palette: ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
 *   selectedIndex: 1,
 *   numCandidates: 9,          // per-batch pool; default 9 if omitted
 *   sectorFilter: {
 *     enabled: true,
 *     deltaH: 20,
 *     deltaR: 20,
 *     targetCount: 9           // how many alternatives to return
 *   },
 *   weights: {
 *     ciede2000: 1.0,
 *     pairPreference: 1.0,
 *     nameDifference: 0.0,
 *     nameUniqueness: 0.0
 *   },
 *   fetch: {
 *     maxLoops: 6              // how many batches max (optional; default 6)
 *   }
 * }
 */
app.post('/api/color-alternatives', async (req, res) => {
  try {
    const { palette, selectedIndex, weights: rawWeights } = req.body;

    // per-batch size: if user omits/enters a string, coerce; default to 9
    const rawNum = req.body.numCandidates;
    const poolPerLoop = Math.max(1, parseInt(rawNum, 10) || 9);

    // fetch controls: how many batches we’re willing to try
    const rawMaxLoops = req.body?.fetch?.maxLoops;
    const maxLoops = Math.max(1, parseInt(rawMaxLoops, 10) || 10);

    // sector filter controls
    const {
      sectorFilter = {
        enabled: true,
        deltaH: 40,   // hue angle degrees [5,10,20,30,40]
        deltaR: 30,   // tolerance for both L* and c* [1,10,20,30,40]
        targetCount: 9 // how many diff alternatives to return
      }
    } = req.body;

    const { enabled, deltaH, deltaR, targetCount } = sectorFilter;

    // --- Validation ---
    if (!palette || !Array.isArray(palette)) {
      return res.status(400).json({ 
        error: 'palette array is required' 
      });
    }

    if (typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex >= palette.length) {
      return res.status(400).json({ 
        error: 'selectedIndex must be a valid index in the palette' 
      });
    }

    // --- Weights (palette-specific) ---
    // Expect weights to be sent per request since each palette is different
    if (!rawWeights || typeof rawWeights !== 'object') {
      return res.status(400).json({
        error: 'weights object is required',
        example: {
          weights: {
            ciede2000: 1.0,
            pairPreference: 1.0,
            nameDifference: 0.0,
            nameUniqueness: 0.0
          }
        }
      });
    }

    // coerce possible string -> number
    const coerceNum = (v, fallback = 0) => {
      const n = typeof v === 'string' ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : fallback;
    };

    const normalizedWeights = {
      ciede2000: coerceNum(rawWeights.ciede2000, 0),
      pairPreference: coerceNum(rawWeights.pairPreference, 0),
      nameDifference: coerceNum(rawWeights.nameDifference, 0),
      nameUniqueness: coerceNum(rawWeights.nameUniqueness, 0),
    };

    console.log('[Proxy] Using weights:', normalizedWeights);
    console.log(`[Proxy] Will try to fill ${targetCount} alternatives for index ${selectedIndex}`);
    console.log(`[Proxy] Per-batch numCandidates=${poolPerLoop}, maxLoops=${maxLoops}`);
    console.log(`Original palette: ${palette.join(', ')}`);
    console.log(`Selected color (will be replaced): ${palette[selectedIndex]}`);
    console.log(`[Proxy] Sector filter: enabled=${enabled}, ΔH=${deltaH}, ΔR=${deltaR}`);

    // Convert palette to LAB
    const paletteLab = palette.map(hexToLab);

    // Get fixed colors (all except the selected one)
    // These will maintain their positions in Colorgorical's output
    const fixedColors = paletteLab.filter((_, idx) => idx !== selectedIndex);
    const fixedColorsHex = palette.filter((_, idx) => idx !== selectedIndex);

    console.log(`Fixed colors (HEX): ${fixedColorsHex.join(', ')}`);
    console.log(`Fixed ${fixedColors.length} colors (LAB), generating 1 new color per candidate`);
    console.log(`Note: Colorgorical includes startPalette in EVERY candidate and generates remaining colors`);
    console.log(`Each candidate has RANDOMNESS - alternatives will vary even with same inputs`);

    // Prepare API request
    // We'll fetch small batches until we fill `targetCount` or hit `maxLoops`.
    // `poolPerLoop` (parsed earlier) is how many candidates to ask for per batch

    const makeApiRequest = (batchSize) => ({
      paletteSize: palette.length,
      numCandidates: batchSize,          // per-batch ask
      startPalette: fixedColors,         // keep other colors fixed
      weights: normalizedWeights,        // palette-specific weights
      lightnessRange: ["25", "85"],      // strings, as required by the server
      hueFilters: []
    });

    // --- Batched fetch & greedy fill ---
    let survivors = [];
    let survivorsLab = [];
    let survivorsLch = [];
    const seenSurvivorHex = new Set();

    // global sectors we've already used
    const usedSectorKeys = new Set();

    let loops = 0;
    let totalCandidatesSeen = 0;
    const poolHexSeen = new Set();

    while (survivors.length < targetCount && loops < maxLoops) {
      loops++;

      const apiRequest = makeApiRequest(poolPerLoop);
      console.log(`[Proxy] Batch ${loops}: requesting ${apiRequest.numCandidates} candidates`);

      let result;
      try {
        const response = await axios.post(COLORGORICAL_API, apiRequest, { timeout: 30000 });
        result = response.data;
      } catch (err) {
        console.error(`[Proxy] Colorgorical request failed on loop ${loops}:`, err.message);
        break;
      }

      const candList = Array.isArray(result?.candidates) ? result.candidates : [];
      if (!candList.length) {
        console.warn(`[Proxy] No candidates returned on loop ${loops}`);
        continue;
      }

      // Extract the generated color (first generated is at index result.numFixed)
      const idxNew = result.numFixed ?? fixedColors.length;
      const batchHex = candList.map(c => c.palette_hex[idxNew]).filter(Boolean);

      totalCandidatesSeen += batchHex.length;
      batchHex.forEach(h => poolHexSeen.add(String(h).toUpperCase()));

      // Precompute Lab/LCh for this batch
      const batchLab = batchHex.map(h => hexToLab(h));
      const batchLch = batchLab.map(lab => labToLch(lab));

      // Greedy pass in generator ranking order
      for (let i = 0; i < batchHex.length && survivors.length < targetCount; i++) {
        const hex = batchHex[i];
        const hexKey = String(hex).toUpperCase();
        if (seenSurvivorHex.has(hexKey)) continue;

        const candLab = batchLab[i];
        const candLch = batchLch[i];

        // ---- GLOBAL SECTOR LOGIC ----
        // Map candidate into a global (L, C, H) bin based on deltaH and deltaR
        let sectorKey = null;
        if (enabled) {
          sectorKey = getSectorKey(candLch, deltaH, deltaR);
          if (usedSectorKeys.has(sectorKey)) {
            // we've already picked a representative from this sector
            continue;
          }
        }

        // Accept this candidate
        survivors.push(hex);
        survivorsLab.push(candLab);
        survivorsLch.push(candLch);
        seenSurvivorHex.add(hexKey);
        if (enabled && sectorKey !== null) {
          usedSectorKeys.add(sectorKey);
        }
      }
    }

    console.log(`[Proxy] Filled ${survivors.length}/${targetCount} after ${loops} batch(es). Unique pool seen: ${poolHexSeen.size}; total candidates seen: ${totalCandidatesSeen}`);    

    // --- Diversity / counts for response ---
    const originalAlternativesCount = totalCandidatesSeen;
    const rejectedBySector = Math.max(0, originalAlternativesCount - survivors.length);

    // Build full candidate pool (unique in this request)
    const candidatePoolHex = Array.from(poolHexSeen);
    const candidatePoolLab = candidatePoolHex.map(hexToLab);
    const candidatePoolLch = candidatePoolLab.map(labToLch);

    // ---- response & metadata (updated) ----
    res.json({
    success: true,
    alternatives: survivors,          // hex for chosen alternatives
    alternativesLab: survivorsLab,    // [[L,a,b], ...] for chosen
    alternativesLch: survivorsLch,    // [[L,c,h], ...] for chosen
    originalColor: palette[selectedIndex],
    selectedIndex,
    pool: {
      hex: candidatePoolHex,          // all unique generator candidates in this request
      lab: candidatePoolLab,          // [[L,a,b], ...]
      lch: candidatePoolLch           // [[L,c,h], ...]
    },
    metadata: {
      // per-batch ask
      requestedCandidates: poolPerLoop,
      sectorFilter: { enabled, deltaH, deltaR, targetCount },
      weights: normalizedWeights,
      returned: survivors.length,
      originalAlternativesCount,      // total seen across all batches
      rejectedBySector,               // total seen minus kept
      batchesFetched: loops,          // how many loops we ran
      poolPerLoop,                    // batch size used
      totalUniqueSeen: poolHexSeen.size,
    }
  });

  } catch (error) {
    console.error('Error generating alternatives:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Cannot connect to Colorgorical API',
        message: `Is the Colorgorical server running at ${COLORGORICAL_API}?`,
        details: error.message
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Colorgorical API error',
        message: error.response.data,
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test endpoint that doesn't require Colorgorical (for development)
app.post('/api/color-alternatives/test', (req, res) => {
  const { palette, selectedIndex, numCandidates = 9 } = req.body;
  
  // Generate test alternatives (slightly varied colors)
  const baseColor = palette[selectedIndex];
  const alternatives = Array.from({ length: numCandidates }, (_, i) => {
    // Simple color variation for testing
    const rgb = hexToRgb(baseColor);
    const variation = (i - 4) * 10; // -40 to +40
    const newRgb = rgb.map(c => Math.max(0, Math.min(255, c + variation)));
    return `#${newRgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
  });

  res.json({
    success: true,
    alternatives,
    originalColor: baseColor,
    selectedIndex,
    testMode: true
  });
});

app.listen(PORT, () => {
  console.log(`\n🎨 Colorgorical Proxy Server running on port ${PORT}`);
  console.log(`   Colorgorical API: ${COLORGORICAL_API}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/color-alternatives`);
  console.log(`   - POST http://localhost:${PORT}/api/color-alternatives/test (for testing)`);
  console.log(`   - GET  http://localhost:${PORT}/health\n`);
});
