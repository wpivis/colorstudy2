import { useEffect, useState } from 'react';
import {
  Box, Button, Grid, Group, Slider, Stack, Text,
} from '@mantine/core';
import { VegaLite } from 'react-vega';
import { StimulusParams } from '../../../store/types';

// ====== visualization data/specs (copied from ColorPaletteComparison) ======

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

// EXACT same map spec as in ColorPaletteComparison
const createMapSpec = (palette: string[]) => {
  const domain = palette.map((_, i) => i.toString());
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 150,
    height: 150,
    autosize: { type: 'none', contains: 'padding' },

    // Same projection parameters as Colorgorical's d3 code
    projection: {
      type: 'albersUsa',
      scale: 2000,
      translate: [40, 100], // 2*width/10, height/2  for 200×200
    },

    layer: [
      // ----- Layer 1: ALL US counties, colored by palette -----
      {
        data: {
          url: usCountiesUrl,
          format: {
            type: 'topojson',
            feature: 'counties',
          },
        },
        transform: [
          {
            // cycle through palette using county id
            calculate: `toString(datum.id % ${palette.length})`,
            as: 'categoryIndex',
          },
        ],
        mark: {
          type: 'geoshape',
          stroke: 'white', // thin borders between counties
          strokeWidth: 0.75,
        },
        encoding: {
          color: {
            field: 'categoryIndex',
            type: 'nominal',
            scale: {
              domain,
              range: palette,
            },
            legend: null,
          },
        },
      },

      // ----- Layer 2: state borders on top (black) -----
      {
        data: {
          url: usCountiesUrl,
          format: {
            type: 'topojson',
            feature: 'states',
          },
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

// ====== Component ======

const LOCAL_STORAGE_KEY = 'colorstudy_palette_mods';

type StoredModificationRecord = {
  paletteId?: string;
  originalPalette: string[];
  newPalette: string[];
  selectedColorIndex: number | null;
  selectedAlternative: string | null;
  madeChange: boolean;
  preference: number | null;
  timestamp: string;
};

type ReviewTrial = {
  paletteId?: string;
  originalPalette: string[];
  newPalette: string[];
};

type ColorPaletteReviewProps = StimulusParams<{
  taskid: string;
}>;

type RatingRecord = {
  paletteId?: string;
  rating: number;
  originalPalette: string[];
  newPalette: string[];
  comparisonIndex: number;
  timestamp: string;
};

const ColorPaletteReview = ({ parameters, setAnswer }: ColorPaletteReviewProps) => {
  const { taskid } = parameters;
  
  const [trials, setTrials] = useState<ReviewTrial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [ratings, setRatings] = useState<RatingRecord[]>([]);
  const [finished, setFinished] = useState(false);

  const marks = [
    { value: 0, label: 'Strongly prefer original' },
    { value: 25, label: 'Prefer original' },
    { value: 50, label: 'No preference' },
    { value: 75, label: 'Prefer new' },
    { value: 100, label: 'Strongly prefer new' },
  ];

  // On mount, load all modification records from localStorage and derive trials
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setTrials([]);
        return;
      }

      const records: StoredModificationRecord[] = JSON.parse(raw);
      
      // Deduplicate by paletteId so we only keep the *last* decision per palette
      const byId = new Map<string, StoredModificationRecord>();

      records.forEach((r) => {
        const id = r.paletteId ?? `anon_${r.timestamp}`;
        // Later records overwrite earlier ones
        byId.set(id, r);
      });
      
      const uniqueRecords = Array.from(byId.values());

      // Only include palettes that were changed
      const changed = uniqueRecords.filter(
        (r) => r.madeChange && r.newPalette && r.newPalette.length > 0,
      );

      // Map to review trials
      const baseTrials: ReviewTrial[] = changed.map((r) => ({
        paletteId: r.paletteId,
        originalPalette: r.originalPalette,
        newPalette: r.newPalette,
      }));

      // Shuffle once
      const arr = [...baseTrials];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
     }

      setTrials(arr);
    } catch (e) {
        console.error('Error reading modification records from localStorage', e);
        setTrials([]);
    }
  }, []);

  // No trials → nothing to review
  if (trials.length === 0) {
    return (
      <Stack gap="md" p="md">
        <Text size="lg" fw={600}>
          No modified palettes to review.
        </Text>
        <Text size="sm">
          This screen only appears for palettes that were changed earlier in the study.
        </Text>
      </Stack>
    );
  }

  const currentTrial = trials[currentIndex];

  const handleSubmitRating = () => {
    const now = new Date().toISOString();

    const newRecord: RatingRecord = {
      paletteId: currentTrial.paletteId,
      rating: sliderValue,
      originalPalette: currentTrial.originalPalette,
      newPalette: currentTrial.newPalette,
      comparisonIndex: currentIndex,
      timestamp: now,
    };

    const updatedRatings = [...ratings, newRecord];
    setRatings(updatedRatings);

    const nextIndex = currentIndex + 1;

    if (nextIndex < trials.length) {
      setCurrentIndex(nextIndex);
      setSliderValue(50);
    } else {
      // All comparisons done → send all ratings once
      setAnswer({
        status: true,
        answers: {
          [taskid]: JSON.stringify({
            ratings: updatedRatings,
            totalComparisons: trials.length,
            completedAt: now,
          }),
        },
      });
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <Stack gap="md" p="md">
        <Text size="lg" fw={600}>
          Thank you!
        </Text>
        <Text size="sm">
          You&apos;ve finished rating all modified palettes. You can proceed to the next part of the study.
        </Text>
      </Stack>
    );
  }

  const { originalPalette, newPalette } = currentTrial;

  return (
    <Stack gap="xl" p="md">
      {/* Instructions */}
      <Stack gap="xs">
        <Text size="lg" fw={700}>
          Which palette do you prefer?
        </Text>
        <Text size="sm">
          You previously modified some palettes. For each pair below, please indicate which palette you like better.
        </Text>    
        <Text size="sm" c="dimmed">
          Comparison
          {' '}
          {currentIndex + 1}
          {' '}
          of
          {' '}
          {trials.length}
        </Text>
      </Stack>

      {/* Side-by-side comparison – same appearance as comparison phase */}
      <Grid gutter="sm" align="start">
        {/* Original Palette Column */}
        <Grid.Col span={{ base: 9, md: 2 }}>
          <Box
            p="xs"
            style={{
              flex: 1,
              maxWidth: 300,
              margin: '0 auto',
              border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 4,
              boxShadow: '0 0 4px rgba(0,0,0,0.04)',
              backgroundColor: 'white',
            }}
          >
            <Stack gap="md">
              <Text size="lg" fw={600}>
                Original Palette
              </Text>
              <Group gap="xs">
                {originalPalette.map((color, index) => (
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

              <Group gap="xs" wrap="wrap" align="flex-start">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createMapSpec(originalPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createBarSpec(originalPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createScatterSpec(originalPalette) as any} actions={false} />
              </Group>
            </Stack>
          </Box>
        </Grid.Col>

        {/* Middle: Slider */}
        <Grid.Col span={{ base: 9, md: 5 }}>
          <Box mt="xl" style={{ maxWidth: 800, margin: '0 auto' }}>
          <Text size="xs" c="dimmed" mt="sm" mb="xs" ta="center">
          Adjust the slider to rate your preference for each pair, then click "Next comparison" to continue.
          </Text>
          <Box px="md">
            <Slider
              value={sliderValue}
              onChange={setSliderValue}
              marks={marks}
              min={0}
              max={100}
              showLabelOnHover={false}
              styles={{
                root: { width: '100%' },
                track: {
                  backgroundColor: '#e9ecef', // light gray full track
                },
                bar: {
                  backgroundColor: 'transparent', // REMOVE blue filled portion
                },
                thumb: {
                  backgroundColor: 'black',
                  border: '2px solid black',
                  width: 16,
                  height: 16,
                },
                mark: {
                  borderColor: '#adb5bd',
                  backgroundColor: '#adb5bd',
                },
                markLabel: {
                  fontSize: 10,
                  color: '#868e96',
                  whiteSpace: 'nowrap',
                },
              }}
            />
          </Box>
        </Box>
        </Grid.Col>

        {/* New (Modified) Palette Column */}
        <Grid.Col span={{ base: 9, md: 2 }}>
          <Box
            p="xs"
            style={{
              flex: 1,
              maxWidth: 300,
              margin: '0 auto',
              border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 4,
              boxShadow: '0 0 4px rgba(0,0,0,0.04)',
              backgroundColor: 'white',
            }}
          >
            <Stack gap="md">
              <Text size="lg" fw={600}>
                New Palette
              </Text>
              <Group gap="xs">
                {newPalette.map((color, index) => (
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

              <Group gap="xs" wrap="wrap" align="flex-start">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createMapSpec(newPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createBarSpec(newPalette) as any} actions={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VegaLite spec={createScatterSpec(newPalette) as any} actions={false} />
              </Group>
            </Stack>
          </Box>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end">
        <Button onClick={handleSubmitRating}>
          {currentIndex + 1 < trials.length ? 'Next comparison' : 'Finish ratings'}
        </Button>
      </Group>
    </Stack>
  );
};

export default ColorPaletteReview;