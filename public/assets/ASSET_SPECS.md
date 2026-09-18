# Path Out Harbor — art lock for path-out-web-ts

**Perspective:** isometric (board + Kenney Watercraft matched)  
**Screen:** 1080×1920  
**Eng:** blit `board_fullscreen_1080x1920.png` full-screen, then boats + UI sprites. No invented chrome.

**Conditional-GO fixes (2026-09-18):**
- Removed baked coin/score "12" HUD from board (no junk chrome)
- `A_skiff` = Kenney `watercraftPack_028` (open wooden dinghy) — NOT cabin boat 010

## Files
| Path | Notes |
|---|---|
| `board_fullscreen_1080x1920.png` | Empty playable water; docks, frame, title, exits, undo — **no score pill** |
| `boats/boat_{id}_{free\|jam}_{right\|down}.png` | True RGBA |
| `ui/` | fog_overlay, lighthouse_cone, shallow_hatch, pilot_badge, lock_x, undo, next, exit arrows |
| `mock_with_boats.png` | Sign-off reference |
| `ATTRIBUTION.md` | CC0 Kenney |

## Iso grid
| Constant | Value |
|---|---|
| OX | **540** |
| OY | **500** |
| TW | **132** |
| TH | **76** |
| GRID | 6×6 |
| Cell origin | `x = OX + (c-r)*(TW/2) - TW/2`, `y = OY + (c+r)*(TH/2)` |
| Frame | (54,400)–(1026,980) |

Legacy aliases if needed: `GRID_X=144`, `GRID_Y=500`, `TILE=132` — prefer iso formulas.

## Cell anchors
| Cell | Tile origin | Center |
|---|---|---|
| 0,0 | (474, 500) | (540, 544) |
| 1,0 | (540, 538) | (606, 582) |
| 2,0 | (606, 576) | (672, 620) |
| 3,0 | (672, 614) | (738, 658) |
| 4,0 | (738, 652) | (804, 696) |
| 5,0 | (804, 690) | (870, 734) |
| 0,1 | (408, 538) | (474, 582) |
| 1,1 | (474, 576) | (540, 620) |
| 2,1 | (540, 614) | (606, 658) |
| 3,1 | (606, 652) | (672, 696) |
| 4,1 | (672, 690) | (738, 734) |
| 5,1 | (738, 728) | (804, 772) |
| 0,2 | (342, 576) | (408, 620) |
| 1,2 | (408, 614) | (474, 658) |
| 2,2 | (474, 652) | (540, 696) |
| 3,2 | (540, 690) | (606, 734) |
| 4,2 | (606, 728) | (672, 772) |
| 5,2 | (672, 766) | (738, 810) |
| 0,3 | (276, 614) | (342, 658) |
| 1,3 | (342, 652) | (408, 696) |
| 2,3 | (408, 690) | (474, 734) |
| 3,3 | (474, 728) | (540, 772) |
| 4,3 | (540, 766) | (606, 810) |
| 5,3 | (606, 804) | (672, 848) |
| 0,4 | (210, 652) | (276, 696) |
| 1,4 | (276, 690) | (342, 734) |
| 2,4 | (342, 728) | (408, 772) |
| 3,4 | (408, 766) | (474, 810) |
| 4,4 | (474, 804) | (540, 848) |
| 5,4 | (540, 842) | (606, 886) |
| 0,5 | (144, 690) | (210, 734) |
| 1,5 | (210, 728) | (276, 772) |
| 2,5 | (276, 766) | (342, 810) |
| 3,5 | (342, 804) | (408, 848) |
| 4,5 | (408, 842) | (474, 886) |
| 5,5 | (474, 880) | (540, 924) |

## Boat footprints + Kenney IDs
| ID | Kenney | H×W | Notes |
|---|---|---|---|
| A_skiff | watercraftPack_028 | 1×2 | open wooden dinghy |
| B_cabin | watercraftPack_015 | 1×3 | cabin |
| C_ferry | watercraftPack_025 | 2×3 | larger |
| D_tug | watercraftPack_005 | 2×4 | cargo/tug |

RIGHT=`_0` DOWN=`_2`. Jam = desat + yellow lock with X.

## Level 1 (`mock_with_boats.png`)
| Boat | State | Facing | Col | Row | Blit XY | Size |
|---|---|---|---|---|---|---|
| A_skiff | free | right | 0 | 0 | (506,511) | 133×93 |
| B_cabin | jam | right | 3 | 0 | (735,637) | 137×106 |
| C_ferry | jam | right | 0 | 3 | (255,621) | 239×170 |
| D_tug | free | right | 2 | 4 | (316,716) | 315×239 |

## Undo hit rect
(56, 1680, 196, 1820)
