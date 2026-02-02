#!/usr/bin/env python3
import json

# Load the palettes
with open('/Users/lane/GitHub/colorstudy2/public/color-palette-study/assets/palettes.json', 'r') as f:
    palettes = json.load(f)

# Load the existing config
with open('/Users/lane/GitHub/colorstudy2/public/color-palette-study/config.json', 'r') as f:
    config = json.load(f)

# Keep introduction and completion
components = {
    'introduction': config['components']['introduction'],
}

# Generate trials for each palette
trial_names = []
for palette in palettes:
    palette_id = palette['palette_id']
    trial_name = f"trial_{palette_id}"
    trial_names.append(trial_name)
    
    components[trial_name] = {
        "baseComponent": "colorTrial",
        "description": f"Palette {palette_id}: {palette['metadata']['palette_size']} colors",
        "meta": palette['metadata'],
        "parameters": {
            "taskid": "paletteResponse",
            "originalPalette": palette['colors'],
            "paletteId": palette_id
        }
    }

components['completion'] = config['components']['completion']

# Update config
config['components'] = components
config['sequence']['components'] = ['introduction'] + trial_names + ['completion']

# Save updated config
with open('/Users/lane/GitHub/colorstudy2/public/color-palette-study/config.json', 'w') as f:
    json.dump(config, f, indent=2)

print(f"✅ Generated {len(trial_names)} trials")
print(f"✅ Updated config.json")
print(f"\nSequence length: {len(config['sequence']['components'])} (including intro and completion)")
