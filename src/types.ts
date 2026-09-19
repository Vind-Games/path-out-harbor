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
  /** Explicit cells; preferred when footprint is truncated (e.g. C vs D on L1). */
  cells?: Cell[]
  /** Sprite top-left cell when collision footprint is truncated. */
  blitOrigin?: Cell
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
  /** Starting lighthouse cone charges (spend to reveal fog). */
  lighthouseCharges?: number
  /** Board cells with cone pickup sprites (tap to arm spend). */
  conePickups?: Cell[]
}

export interface BoatRuntime {
  id: number
  type: BoatType
  facing: Facing
  cells: Cell[]
  /** Design-space sprite anchor (cell). Defaults to min cell. */
  blitOrigin: Cell
  hidden: boolean
  pilotLinkId: number
  gateId: number
  requiresPilot: boolean
}

export const GRID = 6
export const DESIGN_W = 1080
export const DESIGN_H = 1920

/** Ortho top-down grid (isometric OX/OY/TW/TH diamond math removed). */
export const TILE = 128
export const GRID_X = 188
export const GRID_Y = 460

/** Footprint W×H in cells when facing RIGHT. DOWN swaps. */
export const FOOTPRINT: Record<BoatType, { w: number; h: number }> = {
  A_skiff: { w: 2, h: 1 },
  B_cabin: { w: 3, h: 1 },
  C_ferry: { w: 3, h: 2 },
  D_tug: { w: 4, h: 2 },
}

export const UNDO_RECT = { x0: 56, y0: 1680, x1: 196, y1: 1820 }
export const NEXT_RECT = { x0: 400, y0: 1680, x1: 680, y1: 1820 }
/** HUD cone charges (top-right, below baked title). */
export const CHARGE_HUD = { x0: 860, y0: 200, x1: 1040, y1: 300 }
/** Level label band — below yellow PATH OUT banner. */
export const LEVEL_LABEL_Y = 220
export const SOFT_JAM_Y = 275

/** Cell (c,r) top-left in design pixels. */
export function cellOrigin(c: number, r: number): { x: number; y: number } {
  return {
    x: GRID_X + c * TILE,
    y: GRID_Y + r * TILE,
  }
}

export function cellCenter(c: number, r: number): { x: number; y: number } {
  const o = cellOrigin(c, r)
  return { x: o.x + TILE / 2, y: o.y + TILE / 2 }
}

/** Axis-aligned cell hit rect. */
export function cellRect(c: number, r: number): { x: number; y: number; w: number; h: number } {
  const o = cellOrigin(c, r)
  return { x: o.x, y: o.y, w: TILE, h: TILE }
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
