import { useEffect, useMemo, useState } from 'react';
import { Box, Slider, Text, Group, Stack } from '@mantine/core';
import { VegaLite } from 'react-vega';
import { StimulusParams } from '../../../store/types';
import './buttonStyles.css';

type ColorPaletteComparisonProps = StimulusParams<{
  taskid: string;
  paletteId?: string;
  originalPalette: string[];
  selectedIndex: number;        // 0/1/2
  replacementHex: string;       // the chosen alternative hex for that selectedIndex
  trialKey: string;             // unique key (used for deterministic left/right)
  flipLR?: boolean;             // if true, swap left/right relative to the deterministic assignment
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
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

  const [sliderValue, setSliderValue] = useState<number>(50);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

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

  // Build modified palette (single replacement at selectedIndex)
  const modifiedPalette = useMemo(() => {
    const base = originalPalette.map(normalizeHex);
    const repl = normalizeHex(replacementHex);
    const out = [...base];
    if (selectedIndex >= 0 && selectedIndex < out.length) {
      out[selectedIndex] = repl;
    }
    return out;
  }, [originalPalette, selectedIndex, replacementHex]);

  // Deterministic left/right assignment (so refresh won't flip)
  const leftIsOriginalBase = useMemo(() => {
    const h = hashString(trialKey || `${paletteId}-${selectedIndex}-${replacementHex}`);
    return (h % 2) === 0;
  }, [trialKey, paletteId, selectedIndex, replacementHex]);

  const leftIsOriginal = flipLR ? !leftIsOriginalBase : leftIsOriginalBase;
  const leftPalette = leftIsOriginal ? originalPalette : modifiedPalette;
  const rightPalette = leftIsOriginal ? modifiedPalette : originalPalette;

  // Force a consistent "trial transition" re-mount for *all* left/right stimuli (swatches + all charts).
  // Maps already visually “flash” because Vega re-initializes more noticeably; this key makes the
  // bar/scatter/swatches re-mount at the same moment so the whole stimulus updates together.
  const stimulusTransitionKey = useMemo(() => {
    return (
      trialKey ||
      `${paletteId ?? 'noPalette'}-${selectedIndex}-${normalizeHex(replacementHex)}-${flipLR ? 1 : 0}`
    );
  }, [trialKey, paletteId, selectedIndex, replacementHex, flipLR]);

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
    const payload = {
      trialKey,
      paletteId,
      selectedIndex,
      replacementHex: normalizeHex(replacementHex),
      originalPalette: originalPalette.map(normalizeHex),
      modifiedPalette: modifiedPalette.map(normalizeHex),
      flipLR: !!flipLR,
      leftIsOriginalBase,
      leftIsOriginal,
      preference: sliderValue,
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
    originalPalette,
    modifiedPalette,
    leftIsOriginal,
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
          gap={40}                 // adds breathing room so end labels don't touch palette boxes
          align="flex-start"
          justify="center"
          wrap="nowrap"
          style={{
            width: '100%',
            maxWidth: 1250,        // keeps the row centered instead of hugging the left edge
          }}
        >
          {/* LEFT Palette (A) */}
          <Box
            p="sm"
            style={{
              flex: 1,
              maxWidth: 250,
              minWidth: 250,
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
                {leftPalette.map((color, index) => (
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
                <VegaLite spec={createMapSpec(leftPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createBarSpec(leftPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createScatterSpec(leftPalette) as any} actions={false} />
              </Group>
            </Stack>
          </Box>

          {/* MIDDLE SLIDER */}
          <Box
            style={{
              width: 640,
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
              label={null}           // hides the floating label while dragging/clicking
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
                markLabel: { fontSize: 9, width: 70, whiteSpace: 'normal', textAlign: 'center' },
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
              maxWidth: 250,
              minWidth: 250,
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
                {rightPalette.map((color, index) => (
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
                <VegaLite spec={createMapSpec(rightPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createBarSpec(rightPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createScatterSpec(rightPalette) as any} actions={false} />
              </Group>
            </Stack>
          </Box>
      </Group>
      </Box>
    </Stack>
  );
}

export default ColorPaletteComparison;