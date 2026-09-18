# Path Out Harbor

Art-lock Harbor Launch — TypeScript + Vite + Canvas 2D.

- Design space: 1080×1920
- Iso grid: OX=540, OY=500, TW=132, TH=76, 6×6
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
