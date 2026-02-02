#!/usr/bin/env python3
import argparse
import json
import math
from typing import Any, Dict, List

import requests


# ===================== UTILS =====================

def hex_to_rgb255(h: str) -> List[int]:
    h = h.lstrip("#")
    return [int(h[i:i+2], 16) for i in (0, 2, 4)]


def rgb_to_lab(rgb: List[int]) -> List[float]:
    # D65 whitepoint needed for transform
    D65_X = 0.950470
    D65_Y = 1.0
    D65_Z = 1.088830

    def convert(v: float) -> float:
        return v / 12.92 if v <= 0.00304 else ((v + 0.055) / 1.055) ** 2.4

    r = convert(rgb[0] / 255.0)
    g = convert(rgb[1] / 255.0)
    b = convert(rgb[2] / 255.0)

    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / D65_X
    y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / D65_Y
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / D65_Z

    x = x ** (1.0 / 3) if x > 0.008856 else 7.787037 * x + 4.0 / 29
    y = y ** (1.0 / 3) if y > 0.008856 else 7.787037 * y + 4.0 / 29
    z = z ** (1.0 / 3) if z > 0.008856 else 7.787037 * z + 4.0 / 29

    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]


def hex_to_lab(hex_str: str) -> List[float]:
    return rgb_to_lab(hex_to_rgb255(hex_str))


def lab_to_lch(lab: List[float]) -> List[float]:
    L, a, b = lab
    c = math.hypot(a, b)
    h = math.degrees(math.atan2(b, a))
    if h < 0:
        h += 360
    return [L, c, h]


def hue_dist_deg(h1: float, h2: float) -> float:
    d = abs(h1 - h2) % 360
    return 360 - d if d > 180 else d


def in_local_sector(lch_a: List[float], lch_b: List[float], deltaH: int, deltaR: int) -> bool:
    La, Ca, Ha = lch_a
    Lb, Cb, Hb = lch_b
    dLC = math.hypot(Lb - La, Cb - Ca)
    dH = hue_dist_deg(Ha, Hb)
    return (dLC < deltaR) and (dH < deltaH)


def normalize_hex(h: str) -> str:
    h = (h or "").strip()
    if not h:
        return h
    if not h.startswith("#"):
        h = "#" + h
    return h.lower()


# ===================== MAIN =====================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate LOCALalternatives.json using LOCAL sectoring (ΔH=20, ΔR=10) and keep top-2 survivors."
    )
    parser.add_argument("--palettes", default="../palettes.json", help="Path to palettes.json")
    parser.add_argument("--out", default="LOCALalternatives.json", help="Output JSON path")
    parser.add_argument(
        "--colorgorical-url",
        default="http://localhost:8888/api/makePaletteCandidates",
        help="Direct Colorgorical endpoint",
    )
    parser.add_argument("--pool-per-loop", type=int, default=250, help="Candidates per Colorgorical call (default 250)")
    parser.add_argument("--max-loops", type=int, default=6, help="How many calls to accumulate (default 6)")
    parser.add_argument("--timeout", type=int, default=90, help="HTTP timeout seconds (default 90)")
    parser.add_argument("--deltaH", type=int, default=20, help="Local hue tolerance (default 20)")
    parser.add_argument("--deltaR", type=int, default=10, help="Local (L,C) radius tolerance (default 10)")
    parser.add_argument("--topk", type=int, default=2, help="Alternatives to keep per palette-index (default 2)")
    args = parser.parse_args()

    with open(args.palettes, "r") as f:
        palettes = json.load(f)

    results: Dict[str, Dict[str, List[str]]] = {}

    total = len(palettes) * 3
    done = 0

    for palette in palettes:
        palette_id = str(palette.get("palette_id"))
        palette_hex = [normalize_hex(c) for c in palette["colors"]]
        results[palette_id] = {}

        for selected_idx in [0, 1, 2]:
            done += 1
            print(f"[{done}/{total}] palette {palette_id}, idx {selected_idx}", flush=True)

            original_hex = palette_hex[selected_idx]
            original_lch = lab_to_lch(hex_to_lab(original_hex))

            fixed_hex = [c for i, c in enumerate(palette_hex) if i != selected_idx]
            fixed_lab = [hex_to_lab(h) for h in fixed_hex]

            survivors: List[str] = []
            survivors_lch: List[List[float]] = []
            seen_pool = set()

            # Stream batches until we fill topk or exhaust max_loops
            for loop in range(args.max_loops):
                payload = {
                    "paletteSize": len(palette_hex),
                    "numCandidates": args.pool_per_loop,
                    "startPalette": fixed_lab,
                    "lightnessRange": ["25", "85"],
                    "hueFilters": []
                }

                try:
                    resp = requests.post(args.colorgorical_url, json=payload, timeout=args.timeout)
                    resp.raise_for_status()
                    result = resp.json()
                except Exception as e:
                    raise RuntimeError(
                        f"Colorgorical call failed for palette {palette_id} idx {selected_idx} (loop {loop+1}): {e}"
                    )

                cand_list = result.get("candidates", [])
                num_fixed = result.get("numFixed", len(fixed_lab))
                if not cand_list:
                    continue

                # Greedy pass IN THIS BATCH (preserves ranking order from server)
                for c in cand_list:
                    pal_hex = c.get("palette_hex", [])
                    if len(pal_hex) <= num_fixed:
                        continue

                    h = normalize_hex(pal_hex[num_fixed])
                    key = h.upper()
                    if key in seen_pool:
                        continue
                    seen_pool.add(key)

                    if h == original_hex:
                        continue

                    lch = lab_to_lch(hex_to_lab(h))

                    # (A) too close to original?
                    if in_local_sector(original_lch, lch, args.deltaH, args.deltaR):
                        continue

                    # (B) too close to existing survivors?
                    if any(in_local_sector(s_lch, lch, args.deltaH, args.deltaR) for s_lch in survivors_lch):
                        continue

                    survivors.append(h)
                    survivors_lch.append(lch)

                    if len(survivors) >= args.topk:
                        break

                if len(survivors) >= args.topk:
                    break

            if len(survivors) < args.topk:
                raise RuntimeError(
                    f"Only got {len(survivors)}/{args.topk} survivors for palette {palette_id} idx {selected_idx} "
                    f"with ΔH={args.deltaH}, ΔR={args.deltaR}. "
                    f"Try increasing --pool-per-loop and/or --max-loops."
                )

            results[palette_id][str(selected_idx)] = survivors

    with open(args.out, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
