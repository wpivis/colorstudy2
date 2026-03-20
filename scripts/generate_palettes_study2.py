import requests
import json
import time
import os
import itertools

# ---------------------------------------------------------------------------
# Colorgorical endpoint
# ---------------------------------------------------------------------------
URL = 'http://localhost:8888/api/makePaletteCandidates'
# URL = 'http://vrl-v2.cs.brown.edu/color/makePalette'
HEADERS = {'Content-Type': 'application/json'}

PALETTE_SIZE = 3          # only 3-color palettes
MAX_RETRIES  = 100        # max attempts per weight combo before giving up
SLEEP_SEC    = 0.15       # delay between requests

# ---------------------------------------------------------------------------
# Weight grid: all (PD, ND, PP) in {0, 0.5, 1}^3, nameUniqueness fixed to 0
# Produces exactly 27 combos — same as Study 1
# ---------------------------------------------------------------------------
def weight_grid():
    levels = [0.0, 0.5, 1.0]
    for pd, nd, pp in itertools.product(levels, levels, levels):
        yield {
            "ciede2000":     pd,
            "nameDifference": nd,
            "nameUniqueness": 0.0,
            "pairPreference": pp,
        }

# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------
def make_payload(weights: dict) -> dict:
    return {
        "paletteSize":   PALETTE_SIZE,
        "numCandidates":  1,
        "weights":       weights,
        "hueFilters":    [],
        "lightnessRange": ["25", "85"],
        "startPalette":  [],
    }

def post_palette(payload: dict, timeout: int = 30) -> dict:
    try:
        r = requests.post(URL, headers=HEADERS, json=payload, timeout=timeout)
        try:
            body = r.json()
        except Exception:
            body = {"_text": r.text}
        return {"status_code": r.status_code, "response": body}
    except Exception as e:
        return {"status_code": None, "response": {"_error": str(e)}}

# ---------------------------------------------------------------------------
# Overlap detection
# ---------------------------------------------------------------------------
def load_existing_hexes(path: str) -> set[str]:
    """Load all hex codes from palettes.json into a set (lower-case, #rrggbb)."""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    hexes = set()
    for entry in data:
        for h in entry.get('colors', []):
            hexes.add(h.lower())
    return hexes

def has_overlap(new_colors: list[dict], existing_hexes: set[str]) -> bool:
    overlap_count = sum(1 for c in new_colors if c['hex'].lower() in existing_hexes)
    return overlap_count > 1  # allow at most 1 shared color

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    existing_path = os.path.join(script_dir, '../public/color-palette-study/assets/palettes.json')
    output_path   = os.path.join(script_dir, '../public/color-palette-study/assets/palettes-2.json')

    if not os.path.exists(existing_path):
        raise FileNotFoundError(
            f"Could not find palettes.json at {existing_path}\n"
            "Please place palettes.json in the same directory as this script."
        )

    existing_hexes = load_existing_hexes(existing_path)
    print(f"Loaded {len(existing_hexes)} existing hex codes from palettes.json")

    results = []
    weights_list = list(weight_grid())
    assert len(weights_list) == 27, "Expected exactly 27 weight combos"

    print(f"Generating 27 non-overlapping size-{PALETTE_SIZE} palettes...\n")

    for idx, weights in enumerate(weights_list, start=1):
        pd  = weights["ciede2000"]
        nd  = weights["nameDifference"]
        pp  = weights["pairPreference"]
        print(f"[{idx:02d}/27] PD={pd} ND={nd} PP={pp}", end="  ")

        accepted = None
        attempts = 0

        while attempts < MAX_RETRIES:
            attempts += 1
            payload = make_payload(weights)
            res     = post_palette(payload)
            # print("DEBUG:", res)  # add this line temporarily
            body    = res.get('response', {})
            candidates = body.get('candidates') if isinstance(body, dict) else None

            if not isinstance(candidates, list) or len(candidates) == 0:
                print(f"[attempt {attempts}] bad response, retrying...", end=" ")
                time.sleep(SLEEP_SEC)
                continue

            # Pick the first candidate; each has palette_hex ready-made
            hex_colors = candidates[0].get('palette_hex', [])
            if len(hex_colors) != PALETTE_SIZE:
                print(f"[attempt {attempts}] wrong size ({len(hex_colors)}), retrying...", end=" ")
                time.sleep(SLEEP_SEC)
                continue

            colors = [{'hex': h} for h in hex_colors]

            if has_overlap(colors, existing_hexes):
                print(f"[attempt {attempts}] overlap: {[c['hex'] for c in colors]}, retrying...", end=" ") # temporary debug line to show which hexes are causing overlap
                # print(f"[attempt {attempts}] overlap detected, retrying...", end=" ")
                time.sleep(SLEEP_SEC)
                continue

            # Clean palette found — accept it and add its hexes to the seen set
            accepted = colors
            for c in accepted:
                existing_hexes.add(c['hex'].lower())
            break

        if accepted is None:
            print(f"\n  ⚠ FAILED after {MAX_RETRIES} attempts — storing empty palette")
            accepted = []

        hex_list = [c['hex'] for c in accepted]
        print(f"→ {hex_list}")

        results.append({
            "palette_id": str(idx),
            "colors": hex_list,
            "metadata": {
                "palette_size": str(PALETTE_SIZE),
                "PD_ciede2000":      str(pd),
                "ND_nameDifference": str(nd),
                "NU_nameUniqueness": "0.0",
                "PP_pairPreference": str(pp),
            }
        })

        time.sleep(SLEEP_SEC)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"\n✓ Saved {len(results)} palettes to: {output_path}")

    # Sanity check: confirm zero overlap with original palettes.json
    original_hexes = load_existing_hexes(existing_path)
    new_hexes = {h.lower() for entry in results for h in entry['colors']}
    overlap = original_hexes & new_hexes
    if overlap:
        print(f"⚠ WARNING: {len(overlap)} overlapping hex(es) found: {overlap}")
    else:
        print("✓ Overlap check passed — no shared hex codes with palettes.json")


if __name__ == '__main__':
    main()