# Path Out Harbor — TOP-DOWN art lock

**Perspective:** TRUE TOP-DOWN ortho — NOT isometric.  
**Screen:** 1080×1920  
**Exits:** Right = +X (screen right). Down = +Y (screen down).

## Ortho grid
| Constant | Value |
|---|---|
| TILE | **128** |
| GRID_X | **188** |
| GRID_Y | **460** |
| Cell (c,r) | `(GRID_X + c*TILE, GRID_Y + r*TILE)` |
| Dock top Y | 332 |
| Dock left X | 60 |
| Frame | (24,296)–(992,1264) |

## Boats
| ID | H×W | RIGHT px | DOWN px |
|---|---|---|---|
| A_skiff | 1×2 | 256×128 | 128×256 |
| B_cabin | 1×3 | 384×128 | 128×384 |
| C_ferry | 2×3 | 384×256 | 256×384 |
| D_tug | 2×4 | 512×256 | 256×512 |

`right` bow = +X. `down` = 90° CW from right (bow = +Y).

## Level 1 (`mock_with_boats.png`)
| Boat | State | Facing | Col | Row | Pixel | Size |
|---|---|---|---|---|---|---|
| A_skiff | free | right | 0 | 0 | (188,460) | 256×128 |
| B_cabin | jam | right | 3 | 0 | (572,460) | 384×128 |
| C_ferry | jam | right | 0 | 3 | (188,844) | 384×256 |
| D_tug | free | right | 2 | 4 | (444,972) | 512×256 |

## Undo
(56, 1680, 196, 1820)

Also see `mock_axis_proof.png` — same boat facing right vs down on ortho grid.
