import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Box, Slider, Text, Group, Stack,
} from '@mantine/core';
import { VegaLite } from 'react-vega';
import { StimulusParams } from '../../../store/types';
import './buttonStyles.css';

type ColorPaletteComparisonProps = StimulusParams<{
  taskid: string;
  paletteId?: string;
  originalPalette: string[];
  selectedIndex: number; // 0/1/2
  replacementHex: string; // the chosen alternative hex for that selectedIndex
  trialKey: string; // unique key (used for deterministic left/right)
  flipLR?: boolean; // optional explicit left/right flip override
  weights?: {
    ciede2000: number;
    pairPreference: number;
    nameDifference: number;
    nameUniqueness: number;
  };
}>;

// --- helpers ---
const normalizeHex = (h: string) => {
  const s = (h || '').trim();
  if (!s) return s;
  return (s.startsWith('#') ? s : `#${s}`).toLowerCase();
};

// Deterministic string -> integer hash (fast, stable)
const hashString = (s: string) => {
  let h = 2166136261; // FNV-1a-ish
  for (let i = 0; i < s.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // eslint-disable-next-line no-bitwise
  return h >>> 0;
};

type PreferredSide = 'left' | 'right' | 'no_preference';
type PreferredVersion = 'original' | 'modified' | 'no_preference';

const preferredSideFromSlider = (v: number): PreferredSide => {
  if (v < 50) return 'left';
  if (v > 50) return 'right';
  return 'no_preference';
};

const preferredVersionFrom = (preferredSide: PreferredSide, leftIsOriginal: boolean): PreferredVersion => {
  if (preferredSide === 'no_preference') return 'no_preference';

  // If LEFT is original:
  // - pref LEFT  => preferred version = original
  // - pref RIGHT => preferred version = modified
  if (leftIsOriginal) return preferredSide === 'left' ? 'original' : 'modified';

  // If LEFT is modified:
  // - pref LEFT  => preferred version = modified
  // - pref RIGHT => preferred version = original
  return preferredSide === 'left' ? 'modified' : 'original';
};

type Lab = { L: number; a: number; b: number };
type Lch = { L: number; C: number; h: number }; // h in degrees [0, 360)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const hexToRgb01 = (hex: string) => {
  const h = normalizeHex(hex).replace('#', '');
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
};

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// sRGB (D65) -> XYZ (D65)
const rgbToXyz = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  // Matrix for sRGB D65
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;

  return { X, Y, Z };
};

const fLab = (t: number) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : (t / (3 * (6 / 29) ** 2)) + (4 / 29));

// XYZ (D65) -> Lab (D65)
const xyzToLab = ({ X, Y, Z }: { X: number; Y: number; Z: number }): Lab => {
  // D65 reference white
  const Xn = 0.95047;
  const Yn = 1.00000;
  const Zn = 1.08883;

  const fx = fLab(X / Xn);
  const fy = fLab(Y / Yn);
  const fz = fLab(Z / Zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
};

const labToLch = ({ L, a, b }: Lab): Lch => {
  const C = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return { L, C, h };
};

const hexToLabLch = (hex: string) => {
  const rgb = hexToRgb01(hex);
  const xyz = rgbToXyz(rgb);
  const lab = xyzToLab(xyz);
  const lch = labToLch(lab);
  return { lab, lch };
};

function ColorPaletteComparison({ parameters, setAnswer }: ColorPaletteComparisonProps) {
  const {
    taskid,
    paletteId,
    originalPalette,
    selectedIndex,
    replacementHex,
    trialKey,
    flipLR,
  } = parameters;

  // Local state for slider and interaction tracking
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Flash on palette change (new trial)
  const [flashOn, setFlashOn] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  // US counties data URL (using public TopoJSON from US Atlas)
  const usCountiesUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

  const barData = [
    { category: 'A', value: 28 },
    { category: 'B', value: 55 },
    { category: 'C', value: 43 },
    { category: 'D', value: 91 },
    { category: 'E', value: 81 },
    { category: 'F', value: 53 },
  ];

  const scatterData = [
    { x: 10, y: 20, category: 0 },
    { x: 20, y: 30, category: 1 },
    { x: 30, y: 50, category: 2 },
    { x: 40, y: 40, category: 3 },
    { x: 50, y: 70, category: 4 },
    { x: 60, y: 60, category: 5 },
    { x: 70, y: 80, category: 0 },
    { x: 80, y: 90, category: 1 },
  ];

  // Normalize palettes to ensure consistent hex formatting (e.g. #RRGGBB lowercase) for accurate comparisons
  const originalPaletteNorm = useMemo(
    () => originalPalette.map(normalizeHex),
    [originalPalette],
  );

  // Create the modified palette by replacing the selected index with the replacement hex
  const modifiedPaletteNorm = useMemo(() => {
    const base = [...originalPaletteNorm];
    const repl = normalizeHex(replacementHex);
    if (selectedIndex >= 0 && selectedIndex < base.length) {
      base[selectedIndex] = repl;
    }
    return base;
  }, [originalPaletteNorm, selectedIndex, replacementHex]);

  // Deterministic left/right assignment (so refresh won't flip)
  const leftIsOriginalBase = useMemo(() => {
    const h = hashString(trialKey || `${paletteId}-${selectedIndex}-${replacementHex}`);
    return (h % 2) === 0;
  }, [trialKey, paletteId, selectedIndex, replacementHex]);

  const leftIsOriginal = flipLR ? !leftIsOriginalBase : leftIsOriginalBase;
  const leftPaletteHex = leftIsOriginal ? originalPaletteNorm : modifiedPaletteNorm;
  const rightPaletteHex = leftIsOriginal ? modifiedPaletteNorm : originalPaletteNorm;

  // Force a consistent "trial transition" re-mount for *all* left/right stimuli (swatches + all charts).
  // Maps already visually “flash” because Vega re-initializes more noticeably; this key makes the
  // bar/scatter/swatches re-mount at the same moment so the whole stimulus updates together.
  const stimulusTransitionKey = useMemo(() => (
    trialKey
      || `${paletteId ?? 'noPalette'}-${selectedIndex}-${normalizeHex(replacementHex)}-${flipLR ? 1 : 0}`
  ), [trialKey, paletteId, selectedIndex, replacementHex, flipLR]);

  useEffect(() => {
    // Turn overlay ON
    setFlashOn(true);

    // Clear any pending timeout
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }

    // Turn overlay OFF after 250ms
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashOn(false);
      flashTimeoutRef.current = null;
    }, 250);

    // Cleanup on unmount / key change
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, [stimulusTransitionKey]);

  const marks = [
    { value: 0, label: 'Strongly prefer LEFT' },
    { value: 25, label: 'Prefer LEFT' },
    { value: 50, label: 'No preference' },
    { value: 75, label: 'Prefer RIGHT' },
    { value: 100, label: 'Strongly prefer RIGHT' },
  ];

  // Vega-Lite specs
  const createMapSpec = (palette: string[]) => {
    const domain = palette.map((_, i) => i.toString());
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 150,
      height: 150,
      autosize: { type: 'none', contains: 'padding' },
      projection: {
        type: 'albersUsa',
        scale: 2000,
        translate: [40, 100],
      },
      layer: [
        {
          data: {
            url: usCountiesUrl,
            format: { type: 'topojson', feature: 'counties' },
          },
          transform: [
            { calculate: `toString(datum.id % ${palette.length})`, as: 'categoryIndex' },
          ],
          mark: {
            type: 'geoshape',
            stroke: 'white',
            strokeWidth: 0.75,
          },
          encoding: {
            color: {
              field: 'categoryIndex',
              type: 'nominal',
              scale: { domain, range: palette },
              legend: null,
            },
          },
        },
        {
          data: {
            url: usCountiesUrl,
            format: { type: 'topojson', feature: 'states' },
          },
          mark: {
            type: 'geoshape',
            fill: 'none',
            stroke: 'black',
            strokeWidth: 0.75,
          },
        },
      ],
      view: { stroke: null },
    };
  };

  const createBarSpec = (palette: string[]) => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 150,
    height: 150,
    autosize: { type: 'none', contains: 'padding' },
    data: { values: barData },
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'nominal', axis: { labelAngle: 0 } },
      y: { field: 'value', type: 'quantitative' },
      color: {
        field: 'category',
        type: 'nominal',
        scale: { range: palette },
        legend: null,
      },
    },
  });

  const createScatterSpec = (palette: string[]) => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 150,
    height: 150,
    autosize: { type: 'none', contains: 'padding' },
    data: { values: scatterData },
    mark: { type: 'point', filled: true, size: 100 },
    encoding: {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' },
      color: {
        field: 'category',
        type: 'nominal',
        scale: { range: palette },
        legend: null,
      },
    },
  });

  // Save answer reactively (ReVISit will store latest when user clicks Next)
  useEffect(() => {
    const preferredSide = preferredSideFromSlider(sliderValue);
    const preferredVersion = preferredVersionFrom(preferredSide, leftIsOriginal);

    const leftLab = leftPaletteHex.map((h) => hexToLabLch(h).lab);
    const rightLab = rightPaletteHex.map((h) => hexToLabLch(h).lab);
    const leftLch = leftPaletteHex.map((h) => hexToLabLch(h).lch);
    const rightLch = rightPaletteHex.map((h) => hexToLabLch(h).lch);

    const payload = {
      trialKey,
      paletteId,
      selectedIndex,
      replacementHex: normalizeHex(replacementHex),

      // canonical hex palettes
      originalPalette: originalPaletteNorm,
      modifiedPalette: modifiedPaletteNorm,

      // what participant saw on-screen
      leftPaletteHex,
      rightPaletteHex,

      // LAB/LCh per swatch
      leftPaletteLab: leftLab,
      rightPaletteLab: rightLab,
      leftPaletteLch: leftLch,
      rightPaletteLch: rightLch,

      // counterbalancing / inference helpers
      flipLR: !!flipLR,
      leftIsOriginalBase,
      leftIsOriginal,

      // slider + clean derived labels
      preference: sliderValue, // 0..100
      preferredSide, // 'left' | 'right' | 'no_preference'
      preferredVersion, // 'original' | 'modified' | 'no_preference'

      timestamp: new Date().toISOString(),
    };

    if (!hasInteracted) {
      // Keep Next disabled until participant touches the slider
      setAnswer({
        status: false,
        answers: {
          [taskid]: JSON.stringify({
            paletteId,
            // include anything else, but status=false keeps Next disabled
            timestamp: new Date().toISOString(),
          }),
        },
      });
      return;
    }

    // Once interacted, enable Next and store the real response
    setAnswer({
      status: true,
      answers: {
        [taskid]: JSON.stringify(payload),
      },
    });
  }, [
    sliderValue,
    taskid,
    trialKey,
    paletteId,
    selectedIndex,
    replacementHex,
    originalPaletteNorm,
    modifiedPaletteNorm,
    leftPaletteHex,
    rightPaletteHex,
    flipLR,
    leftIsOriginalBase,
    leftIsOriginal,
    hasInteracted,
    setAnswer,
  ]);

  // Keyboard shortcut: Space bar to click Next (after interaction)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && hasInteracted) {
        e.preventDefault();

        // simulate Enter key press (since ReVISit already listens to Enter internally)
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
        });

        document.dispatchEvent(enterEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasInteracted]);

  useEffect(() => {
    document.body.classList.add('hide-next-on-trials');
    return () => {
      document.body.classList.remove('hide-next-on-trials');
    };
  }, []);

  return (
    <Box style={{ position: 'relative' }}>
      {/* 250ms flash overlay on every trial change */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: 'white',
          opacity: flashOn ? 1 : 0,
          transition: 'opacity 250ms ease',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />

      <Stack gap="xl" p="md">
        {/* Center the left palette | slider | right palette row on the page */}
        <Box
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Group
            gap={40} // adds breathing room so end labels don't touch palette boxes
            align="flex-start"
            justify="center"
            wrap="nowrap"
            style={{
              width: '100%',
              maxWidth: '95vw', // keeps the row centered instead of hugging the left edge
            }}
          >
            {/* LEFT Palette (A) */}
            <Box
              p="sm"
              style={{
                flex: 1,
                width: '20vw',
                maxWidth: 280,
                minWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 4,
                boxShadow: '0 0 8px rgba(0,0,0,0.06)',
                backgroundColor: 'white',
              }}
            >
              <Stack
                key={`left-${stimulusTransitionKey}`}
                className="stimulus-transition"
                gap="md"
                style={{ flex: 1, maxWidth: 420 }}
              >
                <Group gap="xs" justify="center">
                  {leftPaletteHex.map((color, index) => (
                    <Box
                      key={index}
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: color,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />
                  ))}
                </Group>

                <Group gap="xs" wrap="wrap" justify="center" align="flex-start">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createMapSpec(leftPaletteHex) as any} actions={false} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createBarSpec(leftPaletteHex) as any} actions={false} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createScatterSpec(leftPaletteHex) as any} actions={false} />
                </Group>
              </Stack>
            </Box>

            {/* MIDDLE SLIDER */}
            <Box
              style={{
                width: '40vw',
                minWidth: 400,
                maxWidth: 700,
                alignSelf: 'center',
                paddingTop: 10,
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              <Text size="lg" fw={600} ta="center" mb="xs">
                Which do you prefer?
              </Text>

              <Slider
                value={sliderValue}
                onChange={(v) => {
                  setSliderValue(v);
                  if (!hasInteracted) setHasInteracted(true);
                }}
                marks={marks}
                min={0}
                max={100}
                label={null} // hides the floating label while dragging/clicking
                styles={{
                  // “black dot” centered
                  track: { backgroundColor: 'transparent' },
                  bar: { backgroundColor: 'transparent' },
                  thumb: {
                    backgroundColor: 'black',
                    border: '2px solid black',
                    width: 20,
                    height: 20,
                  },
                  mark: { borderColor: '#999' },
                  markLabel: {
                    fontSize: 9, width: 70, whiteSpace: 'normal', textAlign: 'center',
                  },
                }}
              />
              <Text size="sm" c="dimmed" mt="xl" ta="center">
                Please move the slider and press the Spacebar to continue.
              </Text>
            </Box>

            {/* RIGHT Palette (B) */}
            <Box
              p="sm"
              style={{
                flex: 1,
                width: '20vw',
                maxWidth: 280,
                minWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 4,
                boxShadow: '0 0 8px rgba(0,0,0,0.06)',
                backgroundColor: 'white',
              }}
            >
              <Stack
                key={`right-${stimulusTransitionKey}`}
                className="stimulus-transition"
                gap="md"
                style={{ flex: 1, maxWidth: 420 }}
              >
                <Group gap="xs" justify="center">
                  {rightPaletteHex.map((color, index) => (
                    <Box
                      key={index}
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: color,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />
                  ))}
                </Group>

                <Group gap="xs" wrap="wrap" justify="center" align="flex-start">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createMapSpec(rightPaletteHex) as any} actions={false} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createBarSpec(rightPaletteHex) as any} actions={false} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <VegaLite spec={createScatterSpec(rightPaletteHex) as any} actions={false} />
                </Group>
              </Stack>
            </Box>
          </Group>
        </Box>
      </Stack>
    </Box>
  );
}

export default ColorPaletteComparison;
