"""World props for the walkable level, in the profile's doodle style.

Each function returns (width, height, svg_body). Thick dark outlines, flat
fills with one shade, like the rest of the Mini Militia art.
"""
O = 'stroke="#0b0a10" stroke-width="3" stroke-linejoin="round"'
O2 = 'stroke="#0b0a10" stroke-width="2" stroke-linejoin="round"'


def terminal():
    """ID terminal: a desk with a monitor, keyboard and a dog tag."""
    return 150, 120, (
        f'<rect x="8" y="70" width="134" height="12" rx="2" fill="#6b4e2e" {O}/>'
        f'<rect x="16" y="82" width="10" height="36" fill="#4a3620" {O2}/>'
        f'<rect x="124" y="82" width="10" height="36" fill="#4a3620" {O2}/>'
        f'<rect x="34" y="6" width="84" height="56" rx="4" fill="#2b2f38" {O}/>'
        '<rect x="41" y="12" width="70" height="42" fill="#0e2a16"/>'
        '<g fill="#4fd13f"><rect x="46" y="17" width="38" height="3"/><rect x="46" y="24" width="52" height="3"/>'
        '<rect x="46" y="31" width="30" height="3"/><rect x="46" y="38" width="44" height="3"/>'
        '<rect x="46" y="45" width="8" height="4" class="blink"/></g>'
        f'<rect x="70" y="62" width="12" height="8" fill="#2b2f38" {O2}/>'
        f'<rect x="44" y="64" width="46" height="7" rx="2" fill="#3b3f45" {O2}/>'
        '<path d="M112,66 q6,14 14,2" fill="none" stroke="#9aa1a8" stroke-width="2"/>'
        f'<rect x="120" y="68" width="14" height="10" rx="3" fill="#d6dade" {O2}/>')


def rack():
    """Weapon locker with an open door and rifles inside."""
    guns = "".join(
        f'<g transform="translate({22 + i * 22} 30) rotate(90)"><rect x="0" y="-3" width="92" height="7" rx="2" fill="#1e2226"/>'
        f'<rect x="30" y="4" width="6" height="14" fill="#1e2226"/><rect x="60" y="-7" width="14" height="4" fill="#4a525a"/></g>'
        for i in range(4))
    return 150, 180, (
        f'<rect x="6" y="8" width="104" height="168" rx="4" fill="#556b3a" {O}/>'
        '<rect x="14" y="18" width="88" height="148" fill="#23281d"/>' + guns +
        f'<rect x="106" y="10" width="40" height="164" rx="3" fill="#6b7f45" {O} transform="skewY(-6)"/>'
        '<rect x="116" y="30" width="18" height="4" rx="2" fill="#2e3a1f" transform="skewY(-6)"/>'
        '<rect x="116" y="42" width="18" height="4" rx="2" fill="#2e3a1f" transform="skewY(-6)"/>'
        f'<rect x="40" y="0" width="36" height="12" rx="2" fill="#ffc21a" {O2}/>'
        '<path d="M46,3 h24 M46,8 h16" stroke="#0b0a10" stroke-width="2"/>')


def board():
    """Mission board: cork board on posts with six pinned sheets."""
    sheets = ""
    for i in range(6):
        x, y = 22 + (i % 3) * 56, 22 + (i // 3) * 52
        stamp = '#4fd13f' if i == 0 else '#2f8cff' if i < 3 else '#9a92bc'
        sheets += (f'<g transform="rotate({(-4, 3, -2, 5, -3, 2)[i]} {x + 22} {y + 20})">'
                   f'<rect x="{x}" y="{y}" width="44" height="42" fill="#f1ead2" {O2}/>'
                   f'<rect x="{x + 6}" y="{y + 10}" width="30" height="3" fill="#8a8170"/>'
                   f'<rect x="{x + 6}" y="{y + 17}" width="24" height="3" fill="#8a8170"/>'
                   f'<rect x="{x + 6}" y="{y + 26}" width="20" height="9" fill="{stamp}" opacity=".85"/>'
                   f'<circle cx="{x + 22}" cy="{y + 3}" r="3.5" fill="#ff3b2f" {O2}/></g>')
    return 210, 170, (
        f'<rect x="30" y="120" width="12" height="48" fill="#4a3620" {O2}/>'
        f'<rect x="168" y="120" width="12" height="48" fill="#4a3620" {O2}/>'
        f'<rect x="6" y="6" width="198" height="124" rx="4" fill="#b98c55" {O}/>'
        '<rect x="14" y="14" width="182" height="108" fill="#a57a46"/>' + sheets)


def tower():
    """Radar dish on a scaffold, for the ledge only the jetpack reaches."""
    return 130, 190, (
        '<path d="M30,188 L52,70 H78 L100,188" fill="none" stroke="#0b0a10" stroke-width="5" stroke-linejoin="round"/>'
        '<path d="M36,160 L94,160 M44,120 L86,120 M50,90 L80,90 M36,160 L86,120 M94,160 L44,120" '
        'stroke="#0b0a10" stroke-width="3"/>'
        f'<rect x="48" y="58" width="34" height="16" rx="2" fill="#3b3f45" {O2}/>'
        '<g class="spin-dish" style="transform-origin:65px 40px">'
        f'<path d="M22,38 Q65,78 108,38 Q65,58 22,38 Z" fill="#d6dade" {O}/>'
        f'<path d="M65,50 L65,20" {O2}/><circle cx="65" cy="18" r="5" fill="#ff3b2f" {O2}/></g>')


def radio():
    """Comms mast with a radio set and a blinking beacon."""
    return 110, 250, (
        f'<rect x="50" y="20" width="8" height="220" fill="#8e959c" {O2}/>'
        '<path d="M54,60 L28,240 M54,60 L80,240 M40,150 L68,150 M34,200 L74,200" stroke="#0b0a10" stroke-width="3"/>'
        '<circle cx="54" cy="14" r="7" fill="#ff3b2f" class="blink"/>'
        '<path d="M34,30 q20,-16 40,0 M26,22 q28,-24 56,0" fill="none" stroke="#ffc21a" stroke-width="3" class="waves"/>'
        f'<rect x="10" y="196" width="60" height="44" rx="4" fill="#556b3a" {O}/>'
        '<circle cx="28" cy="218" r="9" fill="#23281d"/><rect x="44" y="208" width="18" height="6" fill="#ffc21a"/>'
        '<rect x="44" y="220" width="18" height="6" fill="#4fd13f"/>')


def crate(label=""):
    return 70, 58, (
        f'<rect x="3" y="3" width="64" height="52" rx="2" fill="#8a6a3c" {O}/>'
        '<rect x="3" y="3" width="64" height="10" fill="#6b4e2e"/>'
        '<path d="M8,16 L62,50 M62,16 L8,50" stroke="#5b4428" stroke-width="4"/>'
        f'<rect x="3" y="3" width="64" height="52" rx="2" fill="none" {O}/>'
        + (f'<text x="35" y="38" text-anchor="middle" font-family="Silkscreen,monospace" font-size="11" '
           f'fill="#ffc21a" stroke="#0b0a10" stroke-width="3" paint-order="stroke">{label}</text>' if label else ""))


def sandbags():
    bags = "".join(f'<ellipse cx="{x}" cy="{y}" rx="16" ry="9" fill="#c8b27a" {O2}/>'
                   for x, y in ((18, 40), (48, 40), (78, 40), (33, 26), (63, 26), (48, 13)))
    return 96, 50, bags


def billboard():
    """Frame for the spawn billboard; the name is HTML laid over it."""
    return 520, 230, (
        f'<rect x="60" y="150" width="14" height="80" fill="#4a3620" {O2}/>'
        f'<rect x="446" y="150" width="14" height="80" fill="#4a3620" {O2}/>'
        f'<rect x="6" y="6" width="508" height="156" rx="6" fill="#221d45" {O}/>'
        '<rect x="16" y="16" width="488" height="136" fill="none" stroke="#ffc21a" stroke-width="2" stroke-dasharray="8 6"/>')
