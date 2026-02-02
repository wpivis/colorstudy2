#!/usr/bin/env python3
import csv
import json
from collections import defaultdict

# Read the CSV file and group by palette_id
palettes = defaultdict(lambda: {'colors': [], 'metadata': {}})

with open('/Users/lane/Downloads/palettes_81.csv', 'r') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        palette_id = row['palette_id']
        
        # Add color to the palette
        palettes[palette_id]['colors'].append(row['hex'])
        
        # Store metadata (only once per palette, from first row)
        if not palettes[palette_id]['metadata']:
            palettes[palette_id]['metadata'] = {
                'palette_size': row['palette_size'],
                'PD_ciede2000': row['PD_ciede2000'],
                'ND_nameDifference': row['ND_nameDifference'],
                'NU_nameUniqueness': row['NU_nameUniqueness'],
                'PP_pairPreference': row['PP_pairPreference']
            }

# Convert to sorted list for JSON output
palette_list = []
for palette_id in sorted(palettes.keys(), key=int):
    palette_list.append({
        'palette_id': palette_id,
        'colors': palettes[palette_id]['colors'],
        'metadata': palettes[palette_id]['metadata']
    })

# Save to JSON file
output_path = '/Users/lane/GitHub/colorstudy2/public/color-palette-study/assets/palettes.json'
with open(output_path, 'w') as f:
    json.dump(palette_list, f, indent=2)

print(f"✅ Processed {len(palette_list)} palettes")
print(f"✅ Saved to: {output_path}")
print(f"\nSample palette:")
print(json.dumps(palette_list[0], indent=2))
