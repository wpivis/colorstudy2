# Colorgorical API Integration Problem - Need Help!

## Context
I'm building a color palette study where users select ONE color to replace, and I need Colorgorical to generate 9 perceptually-distinct alternatives for that specific color while keeping the other colors EXACTLY as they are.

## Current Setup

### What I'm Sending to Colorgorical
```javascript
{
  "paletteSize": 3,              // Total palette size (e.g., 3 colors)
  "numCandidates": 9,            // Generate 9 alternative palettes
  "startPalette": [              // Fixed colors in LAB format (2 colors)
    [50.0, -20.0, 30.0],        // Color A (will stay fixed)
    [70.0, 15.0, -25.0]         // Color C (will stay fixed)
  ],
  "weights": {
    "ciede2000": 1.0,
    "nameDifference": 0.0,
    "nameUniqueness": 0.0,
    "pairPreference": 0.0
  }
}
```

**Note:** I removed Color B (the one user wants to replace) from the palette before sending.

### What I'm Getting Back
```javascript
{
  "candidates": [
    {
      "palette_hex": ["#a4d6f0", "#d6b6e1", "#458612"],
      "palette_lab": [[...], [...], [...]]
    },
    // ... 8 more candidates
  ]
}
```

## THE PROBLEM

**Expected Behavior:**
- Fixed colors should stay EXACTLY as I sent them
- Only the NEW color (at position where B was removed) should vary
- All 9 candidates should have DIFFERENT new colors

**Actual Behavior:**
- The "fixed" colors in the response are MODIFIED (lighter/different shades)
- Original: `#5dade2` → Response: `#a4d6f0` (NOT the same!)
- When I extract alternatives, they're all similar shades
- Something is fundamentally wrong with how we're using the API

## Example Scenario

**User's Original Palette:**
```
Index 0: #5dade2 (light blue)
Index 1: #82e0aa (green) ← USER CLICKS THIS
Index 2: #af7ac5 (purple)
```

**What I Send to Colorgorical:**
```javascript
{
  paletteSize: 3,
  numCandidates: 9,
  startPalette: [
    LAB(#5dade2),  // Keep blue
    LAB(#af7ac5)   // Keep purple
    // Remove green - this is what we want alternatives for
  ]
}
```

**What I Need Back:**
```javascript
candidates: [
  {
    palette_hex: [
      "#5dade2",  // EXACT same blue (unchanged)
      "#af7ac5",  // EXACT same purple (unchanged)
      "#NEW_1"    // New alternative 1
    ]
  },
  {
    palette_hex: [
      "#5dade2",  // EXACT same blue (unchanged)
      "#af7ac5",  // EXACT same purple (unchanged)
      "#NEW_2"    // New alternative 2 (different from NEW_1)
    ]
  },
  // ... 7 more with different NEW colors
]
```

## Questions for You

1. **Is `startPalette` supposed to be fixed/locked colors?**
   - If yes, why are they being modified in the response?
   - If no, what parameter should I use to lock them?

2. **Where does the new color appear in the response?**
   - Always at the end (index -1)?
   - In the position where it was missing from startPalette?
   - Somewhere else?

3. **How do I ensure fixed colors stay EXACTLY as-is?**
   - Is there a `fixedColors` or `lockedColors` parameter?
   - Do I need to use a different API endpoint?
   - Should I be using `startPalette` differently?

4. **Why are all alternatives similar?**
   - Are the weights wrong?
   - Is `ciede2000: 1.0` too low?
   - Should I increase diversity parameters?

5. **What's the correct way to do "replace one color" in Colorgorical?**
   - Should I send the full palette with one color marked as "replaceable"?
   - Is there a better approach than removing the color from startPalette?

## What I've Tried

1. **Extracting from end (index -1):** Still get modified fixed colors
2. **Comparing to find new color:** Works but fixed colors are still wrong
3. **Increasing weights (ciede2000: 50.0):** Caused API errors
4. **Removing lightnessRange:** Didn't help

## Files Available

I have these in the Colorgorical repo:
- `experiment_integration_example.py` - Shows the intended usage
- `colorgorical_app.py` - The Flask/Tornado API server
- `colorgorical_client.py` - Example client code

## What Would Help

Please provide:

1. **The CORRECT API request format** for my use case
2. **Explanation of what `startPalette` actually does**
3. **How to extract the new colors** from the response
4. **Why fixed colors are being modified** and how to prevent it
5. **Working example code** that matches my scenario

## Current Implementation

My proxy code (Node.js):
```javascript
// Get fixed colors (all except selected)
const fixedColors = paletteLab.filter((_, idx) => idx !== selectedIndex);

// Call API
const response = await axios.post('http://localhost:8888/api/makePaletteCandidates', {
  paletteSize: palette.length,
  numCandidates: 9,
  startPalette: fixedColors,  // Send only fixed colors
  weights: { ciede2000: 1.0, ... }
});

// Extract alternatives
const alternatives = response.data.candidates.map(candidate => 
  // ??? What do I extract here ???
  candidate.palette_hex[???]
);
```

## Debug Output Example

When I click color at index 2 in a 3-color palette:

```
Original palette: #5dade2, #82e0aa, #af7ac5
Selected color (will be replaced): #af7ac5
Fixed colors (HEX): #5dade2, #82e0aa

Colorgorical Response:
Candidate 0: ['#a4d6f0', '#a5e8c8', '#NEW_1']
             ^^^^^^^^   ^^^^^^^^   <- These are NOT my original colors!
             Should be: #5dade2    #82e0aa
```

---

**Bottom Line:** I need to keep colors A, B, D fixed (unchanged) and generate diverse alternatives for color C. How do I do this correctly with Colorgorical's API?
