#!/usr/bin/env python3
"""Draws the app icon (bowl with steam on green) as PNG without external libraries.

    python3 tools/make_icons.py      # writes data/icons/icon-512.png and icon-maskable-512.png
Smaller sizes are made from these by build.py (macOS `sips`) or used as is.
"""
import math, os, struct, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG, FG = (0x1D, 0x5A, 0x4B), (0xFF, 0xFF, 0xFF)


def inside(x, y):
    """Logo in a 32x32 box: bowl = lower half-disc centred (16,15) r=13, plus three wavy steam strokes."""
    if y >= 15 and (x - 16) ** 2 + (y - 15) ** 2 <= 13 ** 2:
        return True
    for cx, y0, y1 in ((11, 4, 10), (16, 3, 10), (21, 4, 10)):
        if y0 - 1.1 <= y <= y1 + 1.1:
            yy = min(max(y, y0), y1)
            sx = cx + 1.1 * math.sin((yy - y0) / (y1 - y0) * 2 * math.pi)
            if (x - sx) ** 2 + (y - yy) ** 2 <= 1.1 ** 2:
                return True
    return False


def draw(size, scale):
    """scale: share of the icon the 32-unit logo occupies (0.52 normal, 0.42 maskable safe zone)."""
    k = size * scale / 32.0
    off = (size - 32 * k) / 2
    ss = 3
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            hit = 0
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + .5) / ss - off) / k
                    y = (py + (sy + .5) / ss - off) / k
                    hit += inside(x, y)
            a = hit / (ss * ss)
            row += bytes(round(BG[i] * (1 - a) + FG[i] * a) for i in range(3))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    out = os.path.join(ROOT, "data", "icons")
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "icon-512.png"), "wb").write(draw(512, .56))
    open(os.path.join(out, "icon-maskable-512.png"), "wb").write(draw(512, .44))
    print("icons written to data/icons/")
