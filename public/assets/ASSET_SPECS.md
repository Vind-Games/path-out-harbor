# Path Out Harbor — Port 2D art lock

**Source:** Christoffer Port 2D sheet (`port2d_sheet.png`) — ships chroma-keyed to true RGBA.  
**Perspective:** TRUE TOP-DOWN ortho. Exits Right=+X, Down=+Y.

## Ortho grid (unchanged from topdown)
| Constant | Value |
|---|---|
| TILE | **128** |
| GRID_X | **188** |
| GRID_Y | **460** |
| Cell (c,r) | `(GRID_X + c*TILE, GRID_Y + r*TILE)` |

## Boat map (sheet component IDs)
| ID | Sheet pair (Up, Down) | Visual | H×W | RIGHT px | DOWN px |
|---|---|---|---|---|---|
| A_skiff | 28/29 | rowboat | 1×2 | 256×128 | 128×256 |
| B_cabin | 26/27 | passenger/cabin | 1×3 | 384×128 | 128×384 |
| C_ferry | 18/19 | ferry | 2×3 | 384×256 | 256×384 |
| D_tug | 14/15 | medium cargo (2×4 fit) | 2×4 | 512×256 | 256×512 |

Orientation:
- `down` = sheet Down cut
- `right` = sheet Down rotated **90° CCW** (bow → screen-right)
- jam = desat + lock_x overlay

## Level 1 (`mock_with_boats.png`)
| Boat | State | Facing | Col | Row | Pixel | Size |
|---|---|---|---|---|---|---|
| A_skiff | free | right | 4 | 0 | (700,460) | 256×128 |
| B_cabin | jam | right | 1 | 0 | (316,460) | 384×128 |
| C_ferry | jam | right | 0 | 3 | (188,844) | 384×256 |
| D_tug | free | right | 2 | 4 | (444,972) | 512×256 |

## Level 1 path-clear lock
A occupies cols 4–5 and is free; B occupies cols 1–3 and is jammed behind A. Keep this runtime layout; do not use the source-sheet mock coordinates above.

## Board extras from Port pack
Pier cuts, lighthouse, buoys, bollard composited onto ortho board.

## Undo
(56, 1680, 196, 1820)
