# Color Grid Layout Documentation

## Systematic 3×3 Color Selection Grid

### Visual Layout

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│   Darker, -a*        │   Darker, -b*        │   Darker, +a*        │
│   L: -20             │   L: -20             │   L: -20             │
│   a: -2.3            │   a: 0               │   a: +2.3            │
│   b: 0               │   b: -2.3            │   b: 0               │
│   (less red)         │   (less yellow)      │   (more red)         │
├──────────────────────┼──────────────────────┼──────────────────────┤
│   Same L, -a*        │   ★ ORIGINAL ★       │   Same L, +a*        │
│   L: 0               │   L: 0               │   L: 0               │
│   a: -2.3            │   a: 0               │   a: +2.3            │
│   b: 0               │   b: 0               │   b: 0               │
│   (less red)         │   (unchanged)        │   (more red)         │
├──────────────────────┼──────────────────────┼──────────────────────┤
│   Lighter, -a*       │   Lighter, +b*       │   Lighter, +a*       │
│   L: +20             │   L: +20             │   L: +20             │
│   a: -2.3            │   a: 0               │   a: +2.3            │
│   b: 0               │   b: +2.3            │   b: 0               │
│   (less red)         │   (more yellow)      │   (more red)         │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Color Space Dimensions

#### CIELAB Color Space
The CIELAB (or L\*a\*b\*) color space is designed to be perceptually uniform:
- **L\* (Lightness):** 0 (black) to 100 (white)
- **a\*:** Green (-) to Red (+)
- **b\*:** Blue (-) to Yellow (+)

#### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **JND** | 2.3 | Just Noticeable Difference in Delta E (perceptual threshold) |
| **L\* Step** | 10 | Lightness change per step |
| **L\* Range** | ±20 | Total lightness variation (2 steps) |
| **a\* Shift** | ±2.3 | Red-green dimension shift (1 JND) |
| **b\* Shift** | ±2.3 | Yellow-blue dimension shift (1 JND) |

### Design Rationale

1. **Center Position (Position 4):** Always shows the original color for easy reference
2. **Horizontal Axis (Positions 3, 4, 5):** Explores red/green dimension at constant lightness
3. **Vertical Axis (Positions 1, 4, 7):** Explores yellow/blue dimension with lightness changes
4. **Diagonal Corners:** Combine lightness changes with red/green shifts
5. **Perceptual Uniformity:** All shifts are based on JND, ensuring consistent perceptual differences

### Example Transformation

Starting with a blue color: `#3A7DFF`

**LAB values:** L=52, a=13, b=-60

**Generated alternatives:**
- Position 0: L=32, a=10.7, b=-60 (darker, less red)
- Position 1: L=32, a=13, b=-62.3 (darker, less yellow/more blue)
- Position 2: L=32, a=15.3, b=-60 (darker, more red)
- Position 3: L=52, a=10.7, b=-60 (same L, less red)
- **Position 4: L=52, a=13, b=-60 (ORIGINAL)**
- Position 5: L=52, a=15.3, b=-60 (same L, more red)
- Position 6: L=72, a=10.7, b=-60 (lighter, less red)
- Position 7: L=72, a=13, b=-57.7 (lighter, more yellow/less blue)
- Position 8: L=72, a=15.3, b=-60 (lighter, more red)

### Adjusting JND

To modify the perceptual difference between alternatives, change the `JND_LAB` constant:

```typescript
// More subtle differences (harder to distinguish)
const JND_LAB = 1.5;

// More obvious differences (easier to distinguish)
const JND_LAB = 4.0;

// Current setting (standard perceptual threshold)
const JND_LAB = 2.3;
```

### Gamut Considerations

**Problem:** Not all LAB colors can be displayed in sRGB (the color space of most displays).

**Solution:** The `clampChroma` function automatically finds the nearest displayable color:
- Maintains the same L\* and hue
- Reduces chroma (saturation) until color is displayable
- Preserves perceptual relationships as much as possible

**When it matters:**
- Very saturated colors at extreme lightness values
- Colors near the edges of sRGB gamut
- Vivid reds, blues, and greens are most affected

### Research Applications

This systematic grid enables:
1. **Perceptual studies:** Compare JND values across different base colors
2. **Preference mapping:** Identify which color space dimensions drive preferences
3. **Visualization quality:** Test how color changes affect chart readability
4. **Color palette design:** Systematically explore alternatives to palette colors

### Implementation Details

The color transformation pipeline:
1. Parse hex color → LAB color space
2. Apply dimensional shifts (L, a, b)
3. Clamp L to valid range [0, 100]
4. Clamp chroma to sRGB gamut
5. Convert back to hex color
6. Handle errors gracefully (return original if conversion fails)

### References

- **Delta E:** CIE 2000 color difference formula (ΔE\*₀₀)
- **JND Standard:** Approximately 2.3 ΔE units (varies by context)
- **CIELAB:** Commission Internationale de l'Éclairage (1976)
- **Color Library:** Culori v4.0.2 (https://culorijs.org/)
