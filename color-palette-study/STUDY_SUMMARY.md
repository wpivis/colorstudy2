# Color Palette Study - Implementation Summary

## Overview
Successfully created an interactive color palette comparison study with **81 trials** using the reVISit framework.

## Data Processing

### CSV Structure
- **Input**: `palettes_81.csv` with long-format data (each row = one color)
- **Transformation**: Widened data so each palette_id becomes one row
- **Output**: `palettes.json` with 81 palettes

### Palette Data Structure
Each palette contains:
- `palette_id`: Unique identifier (1-81)
- `colors`: Array of hex color codes
- `metadata`:
  - `palette_size`: Number of colors (3, 5, or 8)
  - `PD_ciede2000`: Perceptual distance metric
  - `ND_nameDifference`: Name difference score  
  - `NU_nameUniqueness`: Name uniqueness score
  - `PP_pairPreference`: Pair preference score

## Study Configuration

### Components
- **1 Introduction** component
- **81 Trial** components (one per palette)
- **1 Completion** component
- **Total**: 83 components in sequence

### Trial Structure
Each trial passes the following parameters:
- `taskid`: "paletteResponse" (for data collection)
- `originalPalette`: Array of hex colors
- `paletteId`: Palette identifier for tracking

### Metadata Integration
All palette metadata is stored in the `meta` field of each trial component, allowing for later analysis correlation with:
- Palette size
- Perceptual distance
- Name differences
- Preference scores

## Study Flow

### Phase 1: Color Selection
1. Participant sees original palette (3-8 colors depending on palette_size)
2. Click any color to see 9 random alternative colors
3. Select an alternative to replace the chosen color
4. Automatically advances to Phase 2

### Phase 2: Comparison
1. Side-by-side display:
   - **Left**: Original palette with 3 visualizations (map, bar chart, scatterplot)
   - **Right**: Modified palette with same 3 visualizations
2. Slider for preference rating (0-100 scale)
3. "Confirm and Continue" button proceeds to next trial

## Data Collection

### Captured Data Per Trial
- `paletteId`: Which palette was shown
- `originalPalette`: Array of original colors
- `selectedColorIndex`: Which color position was selected (0-based)
- `selectedAlternative`: The new color hex value chosen
- `newPalette`: Complete modified palette array
- `preference`: Slider value (0 = strongly prefer original, 100 = strongly prefer new)
- `timestamp`: ISO 8601 timestamp of response

## Visualizations

### Three Vega-Lite Charts
1. **Map** (Choropleth): 6 regions colored by quantitative scale
2. **Bar Chart**: 6 categories with color encoding
3. **Scatterplot**: Points colored by category (6 levels)

All visualizations use the same color palette for consistent comparison.

## Files Created

### Configuration
- `/public/color-palette-study/config.json` - Study configuration (81 trials)
- `/public/color-palette-study/assets/palettes.json` - Processed palette data

### Component
- `/src/public/color-palette-study/assets/ColorPaletteComparison.tsx` - React component

### Documentation
- `/public/color-palette-study/assets/introduction.md` - Study instructions
- `/public/color-palette-study/assets/completion.md` - Thank you message

### Scripts
- `/scripts/process_palettes.py` - CSV to JSON transformer
- `/scripts/generate_trials.py` - Config generator

## Validation

✅ Study config validated with reVISit MCP server
✅ All 83 components properly configured
✅ Global config updated and validated
✅ TypeScript compilation successful
✅ No linting errors

## Access

Study is available at: **http://localhost:8080/**
Select "color-palette-study" from the study list.

## Estimated Study Duration
- Introduction: ~2 minutes
- 81 trials × ~1-2 minutes each: 81-162 minutes
- Total: ~1.5-3 hours

**Recommendation**: Consider adding breaks or splitting into sessions for participant comfort.
