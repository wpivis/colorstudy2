#!/usr/bin/env python3
import argparse
import json
import random
from copy import deepcopy
from typing import Any, Dict, List

# If True, the order of blocks will also be randomized per participant/session.
# Break screens stay attached to their corresponding block.
RANDOMIZE_BLOCK_ORDER = True

def normalize_hex(h: str) -> str:
    h = (h or "").strip()
    if not h:
        return h
    if not h.startswith("#"):
        h = "#" + h
    return h.lower()


def weights_from_palette_metadata(meta: Dict[str, Any]) -> Dict[str, float]:
    return {
        "ciede2000": float(meta.get("PD_ciede2000", 0.0)),
        "nameDifference": float(meta.get("ND_nameDifference", 0.0)),
        "nameUniqueness": float(meta.get("NU_nameUniqueness", 0.0)),
        "pairPreference": float(meta.get("PP_pairPreference", 0.0)),
    }

def require_meta_float(meta: Dict[str, Any], key: str, pid: str) -> float:
    if key not in meta:
        raise RuntimeError(f"palettes.json missing metadata field '{key}' for palette_id={pid}")
    try:
        return float(meta[key])
    except Exception as e:
        raise RuntimeError(
            f"metadata field '{key}' for palette_id={pid} must be a number/string-number; got {meta[key]!r}"
        ) from e


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate ReVISit config.json with 6 blocks (27 unique palettes per block) + breaks + runtime random order."
    )
    parser.add_argument(
        "--base-config",
        default="../public/color-palette-study/config.json",
        help="Path to your existing config.json (default: ../public/color-palette-study/config.json)",
    )
    parser.add_argument(
        "--palettes",
        default="../palettes.json",
        help="Path to palettes.json (default: ../palettes.json from scripts/)",
    )
    parser.add_argument(
        "--alternatives",
        default="../alternatives.json",
        help="Path to alternatives.json (default: ../alternatives.json from scripts/)",
    )
    parser.add_argument(
        "--out",
        default="../public/color-palette-study/config.generated.json",
        help="Output config path (default: ../public/color-palette-study/config.generated.json)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=12345,
        help="Seed used ONLY to assign each palette’s 6 conditions into the 6 blocks (default: 12345).",
    )
    parser.add_argument(
        "--break-path-template",
        default="color-palette-study/assets/break_{k}.md",
        help="Where break markdown files will live (default: color-palette-study/assets/break_{k}.md)",
    )
    args = parser.parse_args()

    rng = random.Random(args.seed)

    # ---- Load inputs ----
    with open(args.base_config, "r") as f:
        base_cfg = json.load(f)

    with open(args.palettes, "r") as f:
        palettes = json.load(f)

    with open(args.alternatives, "r") as f:
        alternatives = json.load(f)

    # palette lookup
    palette_by_id: Dict[str, Dict[str, Any]] = {}
    for p in palettes:
        pid = str(p.get("palette_id"))
        palette_by_id[pid] = p

    cfg = deepcopy(base_cfg)

    if "components" not in cfg:
        raise RuntimeError("Base config is missing 'components'")

    base_components = cfg["components"]
    if "introduction" not in base_components:
        raise RuntimeError("Base config must include components.introduction")
    if "completion" not in base_components:
        raise RuntimeError("Base config must include components.completion")

    components_new: Dict[str, Any] = {}
    components_new["introduction"] = base_components["introduction"]
    components_new["completion"] = base_components["completion"]

    # ---- Create break components (break_1 ... break_5) ----
    # Percent after each block k (1..5): k/6 of the trials
    # 27 per block, total 162
    for k in range(1, 6):
        pct = (k / 6) * 100.0
        components_new[f"break_{k}"] = {
            "type": "markdown",
            "path": args.break_path_template.format(k=k),
            "response": [],
            "description": f"Break after block {k} ({pct:.1f}% complete)",
        }

    # ---- Build all comparison trials grouped by paletteId ----
    # Each palette has 3 indices × 2 alternatives = 6 trials
    trials_by_palette: Dict[str, List[str]] = {pid: [] for pid in palette_by_id.keys()}

    for pid, p in palette_by_id.items():
        colors = [normalize_hex(c) for c in p["colors"]]
        meta = p.get("metadata", {})
        weights = weights_from_palette_metadata(meta)
        pd = require_meta_float(meta, "PD_ciede2000", pid)
        nd = require_meta_float(meta, "ND_nameDifference", pid)
        nu = require_meta_float(meta, "NU_nameUniqueness", pid)
        pp = require_meta_float(meta, "PP_pairPreference", pid)


        if pid not in alternatives:
            raise RuntimeError(f"alternatives.json missing paletteId={pid}")

        for idx_str in ["0", "1", "2"]:
            if idx_str not in alternatives[pid]:
                raise RuntimeError(f"alternatives.json missing paletteId={pid} index={idx_str}")

            alts_for_idx = [normalize_hex(x) for x in alternatives[pid][idx_str]]
            if len(alts_for_idx) != 2:
                raise RuntimeError(
                    f"Expected exactly 2 alternatives for paletteId={pid} index={idx_str}, got {len(alts_for_idx)}"
                )

            for alt_i, replacement_hex in enumerate(alts_for_idx):
                trial_key = f"p{pid}_i{idx_str}_a{alt_i}"
                comp_name = f"comp_{trial_key}"

                components_new[comp_name] = {
                    "baseComponent": "colorTrial",
                    "description": f"Comparison {trial_key} (palette {pid}, idx {idx_str}, alt {alt_i}", 
                    "meta": {
                        "palette_size": str(meta.get("palette_size", "3")),
                        "PD_ciede2000": str(pd),
                        "ND_nameDifference": str(nd),
                        "NU_nameUniqueness": str(nu),
                        "PP_pairPreference": str(pp),
                        "selectedIndex": int(idx_str),
                        "altIndex": alt_i,
                        "trialKey": trial_key,
                    },
                    "parameters": {
                        "taskid": "paletteResponse",
                        "paletteId": pid,
                        "originalPalette": colors,
                        "weights": weights,
                        "selectedIndex": int(idx_str),
                        "replacementHex": replacement_hex,
                        "trialKey": trial_key,
                    },
                }


                trials_by_palette[pid].append(comp_name)

        if len(trials_by_palette[pid]) != 6:
            raise RuntimeError(f"Expected 6 trials for palette {pid}, got {len(trials_by_palette[pid])}")

    # ---- Assign exactly 1 trial per palette to each of 6 blocks ----
    blocks: List[List[str]] = [[] for _ in range(6)]  # blocks[0]..blocks[5]
    for pid, trial_list in trials_by_palette.items():
        # randomize which of the 6 conditions goes to block1..block6
        tmp = trial_list[:]
        rng.shuffle(tmp)
        for b in range(6):
            blocks[b].append(tmp[b])

    # Sanity: each block must have 27 (one per palette)
    expected_palettes = len(palette_by_id)
    for b in range(6):
        if len(blocks[b]) != expected_palettes:
            raise RuntimeError(f"Block {b+1} expected {expected_palettes} trials, got {len(blocks[b])}")

    
    # ---- Put blocks into sequence with runtime random order ----
    # Keep top-level fixed so breaks occur after each block.
    sequence_components: List[Any] = ["introduction"]

    for b in range(6):
        block_obj = {
            "id": f"block_{b+1}",
            "order": "random",          # runtime randomization per session
            "components": blocks[b],    # 27 unique palettes, one trial each
        }
        sequence_components.append(block_obj)

        if b < 5:
            sequence_components.append(f"break_{b+1}")

    sequence_components.append("completion")

    cfg["components"] = components_new
    cfg["sequence"] = {
        "order": "fixed",
        "components": sequence_components,
    }

    with open(args.out, "w") as f:
        json.dump(cfg, f, indent=2)

    print(f"✅ Wrote {args.out}")
    print(f"Palettes: {expected_palettes} (expected 27)")
    print("Trials per block:", [len(x) for x in blocks], "(expected [27,27,27,27,27,27])")
    print(f"Total trials: {sum(len(x) for x in blocks)} (expected 162)")
    print("Runtime randomization: each block has order='random' (new order every session).")
    print(f"Condition→block assignment seed: {args.seed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())