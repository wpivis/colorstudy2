#!/usr/bin/env python3
"""
generate_config_study2.py
-----------------------------------
Generates a ReVISit config.json for Study 2 using only the filtered palettes
from study2_filtered.json (those where the regression model confidently
predicts participants will prefer the modified palette).

What this script does:
  1. Reads study2_filtered.json — one entry per palette (22 palettes),
     each with exactly one selectedIndex + replacementHex already chosen
  2. Reads palettes-2.json for palette colors and metadata
  3. Builds 22 unique trial components (comp_p*_i*_a*)
  4. Duplicates all 22 as _rep2 variants with flipLR=True for left/right
     counterbalancing
  5. Creates 2 blocks of 22 trials each with 1 break between them
  6. Randomly assigns original vs flipped versions to block 1 vs block 2 so each
     block has a mix of left/right originals rather than all originals on one side
     across the whole block.
  7. Preserves all non-trial content from base config verbatim

Sequence structure:
  introduction
  → block_1 (22 trials, order=random)
  → break_1
  → block_2 (22 trials, order=random)
  → ishihara_instructions → ishihara_plate_0 → ishihara_block
  → colorvision_survey
  → completion

Total trials: 22 × 2 = 44

Usage:
  python3 generate_config_study2.py \
    --base-config  ../public/color-palette-study/config.json \
    --filtered     study2_filtered.json \
    --palettes     ../public/color-palette-study/assets/palettes.json \
    --out          ../public/color-palette-study/config-study2.generated.json \
    --seed         12345
"""

import argparse
import json
import random
from copy import deepcopy
from typing import Any, Dict, List


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_hex(h: str) -> str:
    h = (h or "").strip()
    if not h:
        return h
    if not h.startswith("#"):
        h = "#" + h
    return h.lower()


def require_meta_float(meta: Dict[str, Any], key: str, pid: str) -> float:
    if key not in meta:
        raise RuntimeError(f"palettes.json missing metadata field '{key}' for palette_id={pid}")
    try:
        return float(meta[key])
    except Exception as e:
        raise RuntimeError(
            f"metadata field '{key}' for palette_id={pid} must be numeric; got {meta[key]!r}"
        ) from e


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-config", default="../public/color-palette-study/config.json")
    parser.add_argument("--filtered",    default="study2_filtered.json")
    parser.add_argument("--palettes",    default="../public/color-palette-study/assets/palettes.json")
    parser.add_argument("--out",         default="../public/color-palette-study/config-study2.generated.json")
    parser.add_argument("--seed",        type=int, default=12345,
                        help="Seed for shuffling trial order within blocks (default: 12345)")
    args = parser.parse_args()

    rng = random.Random(args.seed)

    # ------------------------------------------------------------------ #
    # 1. Load inputs                                                       #
    # ------------------------------------------------------------------ #
    with open(args.base_config, "r") as f:
        base_cfg = json.load(f)

    with open(args.filtered, "r") as f:
        filtered = json.load(f)

    with open(args.palettes, "r") as f:
        palettes = json.load(f)

    # Build palette lookup by id
    palette_by_id: Dict[str, Dict] = {str(p["palette_id"]): p for p in palettes}

    # Validate: each filtered entry must reference a known palette
    for entry in filtered:
        pid = str(entry["paletteId"])
        if pid not in palette_by_id:
            raise RuntimeError(f"study2_filtered.json references palette_id={pid} not found in palettes.json")

    print(f"  Loaded {len(filtered)} filtered palette comparisons")

    # ------------------------------------------------------------------ #
    # 2. Preserve non-trial components from base config verbatim          #
    # ------------------------------------------------------------------ #
    base_components: Dict[str, Any] = base_cfg.get("components", {})

    PRESERVE_KEYS = {
        "consent", "demographics", "introduction", "completion",
        "ishihara_instructions", "colorvision_survey",
        "ishiharaPlate", "colorVisionSurvey",
    }

    components_new: Dict[str, Any] = {}
    for k, v in base_components.items():
        if k in PRESERVE_KEYS or k.startswith("ishihara_plate_"):
            components_new[k] = deepcopy(v)

    # ------------------------------------------------------------------ #
    # 3. Add break_1 component (only 1 break needed)                      #
    # ------------------------------------------------------------------ #
    N_PALETTES   = len(filtered)          # 22
    TOTAL_TRIALS = N_PALETTES * 2         # 44 (22 orig + 22 rep2)

    components_new["break_1"] = {
        "type": "markdown",
        "path": "color-palette-study/assets/break_1.md",
        "response": [],
        "description": f"Break after block 1 (50% complete — {N_PALETTES}/{TOTAL_TRIALS} trials done)",
    }

    # ------------------------------------------------------------------ #
    # 4. Build the 22 unique trial components                             #
    # ------------------------------------------------------------------ #
    # Each entry in filtered.json already has exactly one selectedIndex
    # and replacementHex — the model's best candidate for that palette.
    # So we create exactly one trial component per palette.
    trial_names: List[str] = []

    for entry in filtered:
        pid       = str(entry["paletteId"])
        sel_idx   = int(entry["selectedIndex"])
        alt_idx   = int(entry["altIndex"])
        rep_hex   = normalize_hex(entry["replacementHex"])
        pred      = float(entry["predicted_score"])
        lower     = float(entry["lower_bound"])
        upper     = float(entry["upper_bound"])

        p       = palette_by_id[pid]
        colors  = [normalize_hex(c) for c in p["colors"]]
        meta    = p.get("metadata", {})

        pd_val = require_meta_float(meta, "PD_ciede2000",      pid)
        nd_val = require_meta_float(meta, "ND_nameDifference", pid)
        nu_val = require_meta_float(meta, "NU_nameUniqueness",  pid)
        pp_val = require_meta_float(meta, "PP_pairPreference",  pid)

        weights = {
            "ciede2000":      pd_val,
            "nameDifference": nd_val,
            "nameUniqueness": nu_val,
            "pairPreference": pp_val,
        }

        trial_key = f"p{pid}_i{sel_idx}_a{alt_idx}"
        comp_name = f"comp_{trial_key}"

        components_new[comp_name] = {
            "baseComponent": "colorTrial",
            "description": f"Comparison {trial_key} (palette {pid}, swatch {sel_idx}, alt {alt_idx})",
            "meta": {
                "palette_size":      str(meta.get("palette_size", "3")),
                "PD_ciede2000":      str(pd_val),
                "ND_nameDifference": str(nd_val),
                "NU_nameUniqueness": str(nu_val),
                "PP_pairPreference": str(pp_val),
                "selectedIndex":     sel_idx,
                "altIndex":          alt_idx,
                "trialKey":          trial_key,
                # Store model scores in meta for reference
                "predicted_score":   pred,
                "pi_lower_bound":    lower,
                "pi_upper_bound":    upper,
            },
            "parameters": {
                "taskid":          "paletteResponse",
                "paletteId":       pid,
                "originalPalette": colors,
                "weights":         weights,
                "selectedIndex":   sel_idx,
                "replacementHex":  rep_hex,
                "trialKey":        trial_key,
                "flipLR":          False,
            },
        }

        trial_names.append(comp_name)

    print(f"  Built {len(trial_names)} unique trial components")

    # ------------------------------------------------------------------ #
    # 5. Duplicate all 22 trials as _rep2 with flipLR=True                #
    # ------------------------------------------------------------------ #
    rep2_names: List[str] = []

    for comp_name in trial_names:
        rep_id  = f"{comp_name}_rep2"
        original = components_new[comp_name]
        dup      = deepcopy(original)

        dup["parameters"]["flipLR"]   = True
        dup["parameters"]["trialKey"] = dup["parameters"]["trialKey"] + "_rep2"
        dup["meta"]["trialKey"]       = dup["meta"]["trialKey"] + "_rep2"
        dup["meta"]["repeat"]         = 2
        dup["meta"]["mirrors"]        = comp_name

        components_new[rep_id] = dup
        rep2_names.append(rep_id)

    print(f"  Built {len(rep2_names)} rep2 (flipLR) trial components")

    # ------------------------------------------------------------------ #
    # 6. Randomly assign which version goes to block 1 vs block 2         #
    # ------------------------------------------------------------------ #
    # For each palette, we randomly decide whether the original (flipLR=False)
    # or the flipped rep2 (flipLR=True) goes into block 1.
    # The other version goes into block 2.
    # This ensures block 1 has a mix of original-on-left and original-on-right
    # rather than all originals on one side across the whole block.
    block1_trials: List[str] = []
    block2_trials: List[str] = []

    for orig, rep2 in zip(trial_names, rep2_names):
        if rng.random() < 0.5:
            block1_trials.append(orig)
            block2_trials.append(rep2)
        else:
            block1_trials.append(rep2)
            block2_trials.append(orig)

    # Shuffle within each block so palette order is also randomized
    rng.shuffle(block1_trials)
    rng.shuffle(block2_trials)

    # ------------------------------------------------------------------ #
    # 7. Build the final sequence                                          #
    # ------------------------------------------------------------------ #
    sequence_components: List[Any] = [
        "introduction",
        {
            "id":         "block_1",
            "order":      "random",        # runtime randomization per session
            "components": block1_trials,   # 22 original trials
        },
        "break_1",
        {
            "id":         "block_2",
            "order":      "random",        # runtime randomization per session
            "components": block2_trials,   # 22 rep2 (flipped) trials
        },
        # Post-task measures — same structure as Study 1
        "ishihara_instructions",
        "ishihara_plate_0",
        {
            "id": "ishihara_block",
            "order": "random",
            "components": [
                "ishihara_plate_1",
                "ishihara_plate_2",
                "ishihara_plate_3",
                "ishihara_plate_4",
                "ishihara_plate_5",
                "ishihara_plate_6",
                "ishihara_plate_7",
                "ishihara_plate_8",
                "ishihara_plate_9",
                "ishihara_plate_10",
            ],
        },
        "colorvision_survey",
        "completion",
    ]

    # ------------------------------------------------------------------ #
    # 8. Assemble and write the final config                               #
    # ------------------------------------------------------------------ #
    cfg = deepcopy(base_cfg)
    cfg["components"] = components_new
    cfg["sequence"]   = {
        "order":      "fixed",
        "components": sequence_components,
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
        f.write("\n")

    # ------------------------------------------------------------------ #
    # 9. Summary                                                           #
    # ------------------------------------------------------------------ #
    print(f"\n✅ Wrote {args.out}")
    print(f"   Filtered palettes:   {N_PALETTES}")
    print(f"   Unique trials:       {len(trial_names)}")
    print(f"   Rep2 trials:         {len(rep2_names)}")
    print(f"   Total trials:        {TOTAL_TRIALS}")
    print(f"   Blocks:              2 × {N_PALETTES} trials")
    print(f"   Breaks:              1 (break_1 after block_1)")
    print(f"   Seed:                {args.seed}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())