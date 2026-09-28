"""Generate the site's SVG art from the profile repo's art module.

The soldier, drones and jungle are the same hand-drawn vector art used on the
GitHub profile, so both stay in one style. Run from the repo root:

    python tools/make_art.py ../anujkumarsharma1

Writes assets/art/*.svg and injects the inline pilot into index.html.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROFILE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "anujkumarsharma1").resolve()
sys.path.insert(0, str(PROFILE / "scripts"))

from mm import art  # noqa: E402
from mm.svgkit import Svg  # noqa: E402

OUT = ROOT / "assets" / "art"


def standalone(name, w, h, body, view=None, defs_from=None):
    view = view or f"0 0 {w} {h}"
    defs = "".join(defs_from.defs) if defs_from else ""
    (OUT / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{w}" height="{h}">'
        f"<defs>{defs}</defs>{body}</svg>", encoding="utf-8")


def jungle(seed):
    parts = [
        art.frond(-40, 40, 230, 20, 0.3, 10, art.LEAF_DARK),
        art.frond(-46, 190, 210, 4, 0.26, 9, art.LEAF),
        art.leaf(-18, 320, 150, -16, 0.36, art.LEAF),
        art.frond(-40, 470, 200, -30, 0.3, 9, art.LEAF_DARK),
        art.leaf(-12, 110, 120, 26, 0.38, art.LEAF_LIGHT),
        art.leaf(4, 250, 110, 8, 0.4, art.LEAF_DARK, veins=3),
        art.frond(-30, 620, 190, -12, 0.28, 9, art.LEAF),
        art.leaf(-10, 560, 130, -40, 0.34, art.LEAF_LIGHT),
    ]
    return "".join(parts)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    standalone("jungle-left.svg", 260, 720, jungle(1))
    standalone("jungle-right.svg", 260, 720,
               f'<g transform="translate(260 0) scale(-1 1)">{jungle(2)}</g>')
    standalone("bushes.svg", 1200, 60, art.bushes(1200, 44, seed=4, colour="#07080c"))
    standalone("drone.svg", 90, 80, art.drone(45, 34, 1.0, "d"))

    # mountain tiles that repeat seamlessly (first and last point share a height)
    import random
    for name, h, amp, col, seed in (("mtn-far.svg", 260, 150, "#1c1a3a", 3),
                                    ("mtn-near.svg", 200, 110, "#131228", 8)):
        rnd = random.Random(seed)
        ys = [h - amp * (0.3 + 0.7 * rnd.random()) for _ in range(9)]
        ys.append(ys[0])
        pts = " ".join(f"{i * 200},{y:.0f}" for i, y in enumerate(ys))
        standalone(name, 1800, h, f'<polygon points="0,{h} {pts} 1800,{h}" fill="{col}"/>')

    s = Svg(120, 120, "head")
    standalone("head.svg", 120, 120, art.head_icon(s, 60, 66, 112), defs_from=s)

    # the pilot, inline so the page can aim his arm at the cursor
    p = Svg(10, 10, "pilot")
    body = art.soldier(p, arm_cls="arm", flame_cls="flame", flash_cls="mf")
    # markers the page reads to aim: the shoulder (arm origin) and the muzzle
    mx, my = art.MUZZLE[0] + 15, 5
    body = body.replace('<g class="arm">', '<g class="arm"><circle id="shoulder" r=".1" fill="none"/>'
                        f'<circle id="muzzle" cx="{mx}" cy="{my}" r=".1" fill="none"/>', 1)
    pilot = (f'<svg class="pilot-svg" viewBox="-70 -90 200 175" aria-hidden="true">'
             f'<defs>{"".join(p.defs)}</defs><g id="pilot-body">{body}</g></svg>')
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = re.sub(r"<!--pilot:start-->.*?<!--pilot:end-->",
                  f"<!--pilot:start-->{pilot}<!--pilot:end-->", html, flags=re.S)
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    print("art written; pivot", art.PIVOT, "muzzle", art.MUZZLE)


if __name__ == "__main__":
    main()
