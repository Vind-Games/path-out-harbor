# Path Out Harbor

Art-lock Harbor Launch — TypeScript + Vite + Canvas 2D.

- Design space: 1080×1920
- **Ortho top-down** grid: TILE=128, GRID_X=188, GRID_Y=460 (isometric removed)
- Cell (c,r) origin = `(GRID_X + c*TILE, GRID_Y + r*TILE)`
- Exit anim: facing `right` → +X; facing `down` → +Y
- Deploy base: `/path-out-harbor/`

## Dev

```bash
npm install
npm run dev
```

QA: `?level=N` (1–20)

## Build

```bash
npm run build
```

## Mechanics

- Order-lock: free iff exit path clear on facing axis
- Fog: hidden boats use fog overlay; reveal on adjacent exit
- Pilot: linked skiff must exit before big ship unlocks
- Shallow: only A_skiff may traverse shallow cells
- Lighthouse: spend cone charge (+undo) to reveal fog
