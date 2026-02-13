#!/usr/bin/env python3
"""
Duplicate every unique palette comparison a 2nd time with left/right flipped,
and extend the sequence from 6 blocks -> 12 blocks (adding breaks 6..11).

What it does:
- Finds block_1..block_6 in sequence.components
- Duplicates ONLY the trial components referenced by those blocks:
    comp_*  -> comp_*_rep2
  and sets:
    parameters.flipLR = true
    parameters.trialKey = original + "_rep2"
- Appends block_7..block_12 to the sequence using the rep2 trial IDs
  (block_7 mirrors block_1, ..., block_12 mirrors block_6)
- Adds break_6..break_11 components (markdown) and inserts them between new blocks
- Writes a new config JSON (does not overwrite unless you pass same output path)

Usage:
  python3 duplicate_flip_trials.py config.json config_doubled.json

Optional:
  --make-break-files /path/to/assets/dir
    Creates placeholder break_6.md..break_11.md files if they don't exist.
"""

import argparse
import copy
import json
import os
from pathlib import Path


def is_block_obj(x):
    return isinstance(x, dict) and x.get("id", "").startswith("block_") and "components" in x


def block_num(block_id: str) -> int:
    # "block_6" -> 6
    return int(block_id.split("_")[1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="Path to existing config.json")
    ap.add_argument("output", help="Path to write updated config.json")
    ap.add_argument(
        "--make-break-files",
        default=None,
        help="Optional: path to your markdown assets folder (creates break_6.md..break_11.md placeholders)",
    )
    args = ap.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)

    with in_path.open("r", encoding="utf-8") as f:
        cfg = json.load(f)

    if "sequence" not in cfg or "components" not in cfg["sequence"]:
        raise SystemExit("ERROR: config.json missing sequence.components")

    if "components" not in cfg or not isinstance(cfg["components"], dict):
        raise SystemExit("ERROR: config.json missing top-level components dict")

    seq_components = cfg["sequence"]["components"]
    comp_dict = cfg["components"]

    # ---- 1) Extract block_1..block_6 trial ID lists in order they appear in sequence ----
    blocks_1_to_6 = []
    for item in seq_components:
        if is_block_obj(item):
            n = block_num(item["id"])
            if 1 <= n <= 6:
                blocks_1_to_6.append(item)

    if len(blocks_1_to_6) != 6:
        found = [b["id"] for b in blocks_1_to_6]
        raise SystemExit(f"ERROR: Expected block_1..block_6 in sequence, found: {found}")

    # Map block number -> list of trial component IDs
    block_trials = {block_num(b["id"]): list(b["components"]) for b in blocks_1_to_6}

    # ---- 2) Duplicate only those trial components (comp_*) that appear in blocks 1..6 ----
    trials_in_use = set()
    for n in range(1, 7):
        trials_in_use.update(block_trials[n])

    # Only duplicate "comp_*" trials; leave intro/break/completion etc alone
    trials_to_duplicate = sorted([tid for tid in trials_in_use if tid.startswith("comp_")])

    rep_map = {}  # original_id -> rep2_id
    created = 0

    for tid in trials_to_duplicate:
        if tid not in comp_dict:
            raise SystemExit(f"ERROR: Trial id '{tid}' referenced in a block but not found in components dict")

        rep_id = f"{tid}_rep2"
        if rep_id in comp_dict:
            raise SystemExit(f"ERROR: '{rep_id}' already exists in components dict (won't overwrite)")

        original = comp_dict[tid]
        dup = copy.deepcopy(original)

        # Ensure parameters exist
        params = dup.get("parameters", {})
        if not isinstance(params, dict):
            params = {}
            dup["parameters"] = params

        # Force flip and unique trialKey
        params["flipLR"] = True
        if "trialKey" in params and isinstance(params["trialKey"], str) and params["trialKey"].strip():
            params["trialKey"] = params["trialKey"] + "_rep2"
        else:
            # Fall back: derive from component id
            params["trialKey"] = tid.replace("comp_", "") + "_rep2"

        # Helpful meta tweak (optional)
        meta = dup.get("meta", {})
        if isinstance(meta, dict):
            meta.setdefault("repeat", 2)
            meta.setdefault("mirrors", tid)
            dup["meta"] = meta

        comp_dict[rep_id] = dup
        rep_map[tid] = rep_id
        created += 1

    # ---- 3) Create break_6..break_11 component entries (markdown) ----
    # You already have break_1..break_5 with paths like color-palette-study/assets/break_1.md
    # We'll mirror that pattern.
    for b in range(6, 12):  # 6..11
        bid = f"break_{b}"
        if bid in comp_dict:
            # If it already exists, leave it alone
            continue
        comp_dict[bid] = {
            "type": "markdown",
            "path": f"color-palette-study/assets/break_{b}.md",
            "response": [],
            "description": f"Break after block {b}",
        }

    # ---- 4) Build block_7..block_12 objects by mirroring blocks 1..6 using rep2 IDs ----
    new_blocks = {}
    for n in range(1, 7):
        new_n = n + 6
        new_id = f"block_{new_n}"

        # Convert each trial id to its rep2 id if it was duplicated; otherwise keep it as-is
        new_trial_list = []
        for tid in block_trials[n]:
            new_trial_list.append(rep_map.get(tid, tid))

        # Keep same randomization behavior as original blocks
        new_blocks[new_n] = {
            "id": new_id,
            "order": blocks_1_to_6[n - 1].get("order", "random"),
            "components": new_trial_list,
        }

    # ---- 5) Rewrite sequence.components to insert break_6 after block_6
    #         and append blocks 7..12 with breaks after 7..11, before completion ----
    new_seq = []
    inserted = False

    for item in seq_components:
        new_seq.append(item)

        # After block_6, insert break_6 (only if it's not already there)
        if is_block_obj(item) and item.get("id") == "block_6":
            # If the next item is already break_6, don't duplicate it
            new_seq.append("break_6")

        # Before completion, insert the duplicated half
        if item == "completion" and not inserted:
            # Remove completion temporarily so we can insert before it
            new_seq.pop()

            # Append blocks 7..12, with breaks after 7..11
            for blk in range(7, 13):  # 7..12
                new_seq.append(new_blocks[blk])
                if blk < 12:
                    new_seq.append(f"break_{blk}")

            # Put completion back
            new_seq.append("completion")
            inserted = True

    if not inserted:
        raise SystemExit("ERROR: Did not find 'completion' in sequence.components to insert new blocks before it")

    cfg["sequence"]["components"] = new_seq

    # ---- 6) Create break markdown files ----
    if args.make_break_files:
        assets_dir = Path(args.make_break_files)
        assets_dir.mkdir(parents=True, exist_ok=True)
        for b in range(6, 12):  # break_6..break_11
            md_path = assets_dir / f"break_{b}.md"
            if not md_path.exists():
                md_path.write_text(
                    f"## Break\n\nYou have completed **{b} out of 12 blocks**.\n\n"
                    "Feel free to take a short break. When you're ready, click **Next** to continue.\n",
                    encoding="utf-8",
                )

    # ---- 7) Write output ----
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
        f.write("\n")

    print("✅ Done.")
    print(f"- Duplicated trial components: {created}")
    print(f"- Added blocks: block_7..block_12")
    print(f"- Ensured breaks exist: break_6..break_11")
    print(f"- Wrote: {out_path}")


if __name__ == "__main__":
    main()