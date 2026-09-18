export type Facing = 'right' | 'down'
export type BoatType = 'A_skiff' | 'B_cabin' | 'C_ferry' | 'D_tug'

export interface Cell {
  c: number
  r: number
}

export interface BoatDef {
  type: BoatType
  facing: Facing
  /** Origin cell (min col, min row) — cells derived from footprint if omitted. */
  origin?: Cell
  /** Explicit cells; preferred when footprint is truncated (e.g. D on L1). */
  cells?: Cell[]
  hidden?: boolean
  pilotLinkId?: number
  gateId?: number
  requiresPilot?: boolean
}

export interface LevelDef {
  id: number
  name: string
  boats: BoatDef[]
  shallow?: Cell[]
  lighthouseCharges?: number
}

export interface BoatRuntime {
  id: number
  type: BoatType
  facing: Facing
  cells: Cell[]
  hidden: boolean
  pilotLinkId: number
  gateId: number
  requiresPilot: boolean
}

export const GRID = 6
export const DESIGN_W = 1080
export const DESIGN_H = 1920
export const OX = 540
export const OY = 500
export const TW = 132
export const TH = 76

/** Footprint W×H in cells when facing RIGHT. DOWN swaps. */
export const FOOTPRINT: Record<BoatType, { w: number; h: number }> = {
  A_skiff: { w: 2, h: 1 },
  B_cabin: { w: 3, h: 1 },
  C_ferry: { w: 3, h: 2 },
  D_tug: { w: 4, h: 2 },
}

export const UNDO_RECT = { x0: 56, y0: 1680, x1: 196, y1: 1820 }
export const NEXT_RECT = { x0: 400, y0: 1680, x1: 680, y1: 1820 }

export function cellOrigin(c: number, r: number): { x: number; y: number } {
  return {
    x: OX + (c - r) * (TW / 2) - TW / 2,
    y: OY + (c + r) * (TH / 2),
  }
}

export function cellCenter(c: number, r: number): { x: number; y: number } {
  const o = cellOrigin(c, r)
  return { x: o.x + TW / 2, y: o.y + TH / 2 }
}

export function facingDelta(f: Facing): Cell {
  return f === 'right' ? { c: 1, r: 0 } : { c: 0, r: 1 }
}

export function footprintCells(type: BoatType, facing: Facing, origin: Cell): Cell[] {
  let { w, h } = FOOTPRINT[type]
  if (facing === 'down') {
    const t = w
    w = h
    h = t
  }
  const cells: Cell[] = []
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      cells.push({ c: origin.c + c, r: origin.r + r })
    }
  }
  return cells
}

export function resolveCells(b: BoatDef): Cell[] {
  if (b.cells && b.cells.length) return b.cells.map((x) => ({ ...x }))
  if (!b.origin) throw new Error(`Boat ${b.type} missing cells/origin`)
  return footprintCells(b.type, b.facing, b.origin)
}
