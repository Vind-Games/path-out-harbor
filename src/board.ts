import {
  type BoatDef,
  type BoatRuntime,
  type BoatType,
  type Cell,
  type Facing,
  type LevelDef,
  GRID,
  cellRect,
  facingDelta,
  resolveCells,
} from './types'

const EMPTY = -1

export interface ExitRecord {
  kind: 'exit'
  boatId: number
  fromCells: Cell[]
  blitOrigin: Cell
  type: BoatType
  facing: Facing
  hidden: boolean
  revealedBoats: { id: number; hidden: boolean }[]
  pilotLinkId: number
  gateId: number
  requiresPilot: boolean
  wasPilotSkiff: boolean
}

export interface RevealRecord {
  kind: 'reveal'
  boatId: number
  /** State captured before spending the lighthouse cone. */
  hidden: boolean
  lighthouseCharges: number
  conePickups: Cell[]
  coneArmed: boolean
}

export type MoveRecord = ExitRecord | RevealRecord

export class BoardState {
  width = GRID
  height = GRID
  cells: number[] = []
  boats = new Map<number, BoatRuntime>()
  history: MoveRecord[] = []
  shallow = new Set<string>()
  pilotLinks = new Map<
    number,
    { skiffId: number; shipId: number; gateId: number; skiffExited: boolean }
  >()
  lighthouseCharges = 0
  conePickups: Cell[] = []
  coneArmed = false
  private nextId = 0
  cleared = false

  constructor() {
    this.resetGrid()
  }

  private resetGrid() {
    this.cells = Array(this.width * this.height).fill(EMPTY)
  }

  private key(c: number, r: number) {
    return `${c},${r}`
  }

  private idx(c: number, r: number) {
    return r * this.width + c
  }

  inBounds(c: number, r: number) {
    return c >= 0 && c < this.width && r >= 0 && r < this.height
  }

  getCell(c: number, r: number) {
    if (!this.inBounds(c, r)) return EMPTY
    return this.cells[this.idx(c, r)]
  }

  setCell(c: number, r: number, id: number) {
    if (this.inBounds(c, r)) this.cells[this.idx(c, r)] = id
  }

  isShallow(c: number, r: number) {
    return this.shallow.has(this.key(c, r))
  }

  loadLevel(level: LevelDef) {
    this.resetGrid()
    this.boats.clear()
    this.history = []
    this.shallow.clear()
    this.pilotLinks.clear()
    this.nextId = 0
    this.cleared = false
    this.coneArmed = false
    this.lighthouseCharges = level.lighthouseCharges ?? 0
    this.conePickups = (level.conePickups ?? []).map((p) => ({ ...p }))

    for (const s of level.shallow ?? []) {
      this.shallow.add(this.key(s.c, s.r))
    }

    const linkSkiffs = new Map<number, number>()
    const linkShips = new Map<number, number>()

    for (const def of level.boats) {
      const id = this.addBoat(def)
      if (def.pilotLinkId != null && def.pilotLinkId >= 0) {
        if (def.type === 'A_skiff' && !def.requiresPilot) {
          linkSkiffs.set(def.pilotLinkId, id)
        }
        if (def.requiresPilot) {
          linkShips.set(def.pilotLinkId, id)
        }
      }
    }

    for (const [linkId, skiffId] of linkSkiffs) {
      const shipId = linkShips.get(linkId)
      if (shipId == null) continue
      const skiff = this.boats.get(skiffId)!
      const ship = this.boats.get(shipId)!
      const gateId = skiff.gateId >= 0 ? skiff.gateId : ship.gateId
      this.pilotLinks.set(linkId, {
        skiffId,
        shipId,
        gateId,
        skiffExited: false,
      })
      skiff.pilotLinkId = linkId
      ship.pilotLinkId = linkId
      ship.requiresPilot = true
      if (gateId >= 0) {
        skiff.gateId = gateId
        ship.gateId = gateId
      }
    }
  }

  addBoat(def: BoatDef): number {
    const cells = resolveCells(def)
    const id = this.nextId++
    const minC = Math.min(...cells.map((x) => x.c))
    const minR = Math.min(...cells.map((x) => x.r))
    const boat: BoatRuntime = {
      id,
      type: def.type,
      facing: def.facing,
      cells,
      blitOrigin: def.blitOrigin
        ? { ...def.blitOrigin }
        : def.origin
          ? { ...def.origin }
          : { c: minC, r: minR },
      hidden: !!def.hidden,
      pilotLinkId: def.pilotLinkId ?? -1,
      gateId: def.gateId ?? -1,
      requiresPilot: !!def.requiresPilot,
    }
    for (const cell of cells) {
      if (!this.inBounds(cell.c, cell.r)) {
        throw new Error(`Boat ${def.type} cell out of bounds ${cell.c},${cell.r}`)
      }
      if (this.getCell(cell.c, cell.r) !== EMPTY) {
        throw new Error(
          `Overlap placing ${def.type} at ${cell.c},${cell.r} (had ${this.getCell(cell.c, cell.r)})`,
        )
      }
      this.setCell(cell.c, cell.r, id)
    }
    this.boats.set(id, boat)
    return id
  }

  frontCells(boat: BoatRuntime): Cell[] {
    const d = facingDelta(boat.facing)
    if (d.c !== 0) {
      const frontC =
        d.c > 0 ? Math.max(...boat.cells.map((x) => x.c)) : Math.min(...boat.cells.map((x) => x.c))
      return boat.cells.filter((x) => x.c === frontC)
    }
    const frontR =
      d.r > 0 ? Math.max(...boat.cells.map((x) => x.r)) : Math.min(...boat.cells.map((x) => x.r))
    return boat.cells.filter((x) => x.r === frontR)
  }

  canTraverseShallow(type: BoatType) {
    return type === 'A_skiff'
  }

  isPilotMet(boat: BoatRuntime): boolean {
    if (!boat.requiresPilot) return true
    const link = this.pilotLinks.get(boat.pilotLinkId)
    if (!link) return true
    return link.skiffExited
  }

  isPathClear(boatId: number): boolean {
    const boat = this.boats.get(boatId)
    if (!boat || boat.hidden) return false
    if (!this.isPilotMet(boat)) return false
    const d = facingDelta(boat.facing)
    for (const front of this.frontCells(boat)) {
      let c = front.c + d.c
      let r = front.r + d.r
      while (this.inBounds(c, r)) {
        if (this.getCell(c, r) !== EMPTY) return false
        if (this.isShallow(c, r) && !this.canTraverseShallow(boat.type)) return false
        c += d.c
        r += d.r
      }
    }
    return true
  }

  canTap(boatId: number): boolean {
    const boat = this.boats.get(boatId)
    return !!boat && !boat.hidden
  }

  freeBoatIds(): number[] {
    const out: number[] = []
    for (const id of this.boats.keys()) {
      if (this.isPathClear(id)) out.push(id)
    }
    return out
  }

  hasHiddenBoats(): boolean {
    for (const b of this.boats.values()) {
      if (b.hidden) return true
    }
    return false
  }

  isSoftJam(): boolean {
    if (this.boats.size === 0) return false
    if (this.freeBoatIds().length > 0) return false
    if (this.lighthouseCharges > 0 && this.hasHiddenBoats()) return false
    return true
  }

  private revealAdjacent(exited: Cell[]): { id: number; hidden: boolean }[] {
    const dirs = [
      { c: 0, r: -1 },
      { c: 0, r: 1 },
      { c: -1, r: 0 },
      { c: 1, r: 0 },
    ]
    const revealed: { id: number; hidden: boolean }[] = []
    for (const cell of exited) {
      for (const d of dirs) {
        const ac = cell.c + d.c
        const ar = cell.r + d.r
        const id = this.getCell(ac, ar)
        if (id === EMPTY) continue
        const b = this.boats.get(id)
        if (b && b.hidden && !revealed.some((x) => x.id === id)) {
          revealed.push({ id, hidden: b.hidden })
          b.hidden = false
        }
      }
    }
    return revealed
  }

  armConeFromHud(): boolean {
    if (this.lighthouseCharges <= 0) return false
    this.coneArmed = true
    return true
  }

  armConeAt(c: number, r: number): boolean {
    if (this.lighthouseCharges <= 0) return false
    const idx = this.conePickups.findIndex((p) => p.c === c && p.r === r)
    if (idx < 0) return false
    this.coneArmed = true
    return true
  }

  disarmCone() {
    this.coneArmed = false
  }

  revealWithCone(boatId: number): { ok: boolean; reason?: string } {
    const boat = this.boats.get(boatId)
    if (!boat) return { ok: false, reason: 'invalid' }
    if (!boat.hidden) return { ok: false, reason: 'not-hidden' }
    if (this.lighthouseCharges <= 0) return { ok: false, reason: 'no-charge' }
    if (!this.coneArmed) return { ok: false, reason: 'not-armed' }

    const snapshot = {
      hidden: boat.hidden,
      lighthouseCharges: this.lighthouseCharges,
      conePickups: this.conePickups.map((p) => ({ ...p })),
      coneArmed: this.coneArmed,
    }
    if (this.conePickups.length > 0) {
      this.conePickups.shift()
    }
    this.lighthouseCharges -= 1
    boat.hidden = false
    this.coneArmed = false

    this.history.push({
      kind: 'reveal',
      boatId,
      ...snapshot,
    })
    return { ok: true }
  }

  tryExit(boatId: number): { ok: boolean; reason?: string } {
    const boat = this.boats.get(boatId)
    if (!boat) return { ok: false, reason: 'invalid' }
    if (boat.hidden) return { ok: false, reason: 'hidden' }
    if (!this.isPathClear(boatId)) return { ok: false, reason: 'blocked' }

    const fromCells = boat.cells.map((x) => ({ ...x }))
    const wasPilotSkiff = boat.pilotLinkId >= 0 && boat.type === 'A_skiff' && !boat.requiresPilot

    for (const cell of boat.cells) this.setCell(cell.c, cell.r, EMPTY)

    if (wasPilotSkiff) {
      const link = this.pilotLinks.get(boat.pilotLinkId)
      if (link) link.skiffExited = true
    }

    const revealed = this.revealAdjacent(fromCells)

    this.history.push({
      kind: 'exit',
      boatId,
      fromCells,
      blitOrigin: { ...boat.blitOrigin },
      type: boat.type,
      facing: boat.facing,
      hidden: boat.hidden,
      revealedBoats: revealed,
      pilotLinkId: boat.pilotLinkId,
      gateId: boat.gateId,
      requiresPilot: boat.requiresPilot,
      wasPilotSkiff,
    })

    this.boats.delete(boatId)
    if (this.boats.size === 0) this.cleared = true
    return { ok: true }
  }

  undo(): boolean {
    const rec = this.history.pop()
    if (!rec) return false

    if (rec.kind === 'reveal') {
      const b = this.boats.get(rec.boatId)
      if (b) b.hidden = rec.hidden
      this.lighthouseCharges = rec.lighthouseCharges
      this.conePickups = rec.conePickups.map((p) => ({ ...p }))
      this.coneArmed = rec.coneArmed
      return true
    }

    for (const revealed of rec.revealedBoats) {
      const b = this.boats.get(revealed.id)
      if (b) b.hidden = revealed.hidden
    }

    if (rec.wasPilotSkiff) {
      const link = this.pilotLinks.get(rec.pilotLinkId)
      if (link) link.skiffExited = false
    }

    const boat: BoatRuntime = {
      id: rec.boatId,
      type: rec.type,
      facing: rec.facing,
      cells: rec.fromCells.map((x) => ({ ...x })),
      blitOrigin: { ...rec.blitOrigin },
      hidden: rec.hidden,
      pilotLinkId: rec.pilotLinkId,
      gateId: rec.gateId,
      requiresPilot: rec.requiresPilot,
    }
    for (const cell of boat.cells) this.setCell(cell.c, cell.r, boat.id)
    this.boats.set(boat.id, boat)
    this.cleared = false
    this.coneArmed = false
    return true
  }

  canUndo() {
    return this.history.length > 0
  }

  conePickupAtDesignPoint(x: number, y: number): Cell | null {
    for (const p of this.conePickups) {
      const rect = cellRect(p.c, p.r)
      const pad = 12
      if (
        x >= rect.x - pad &&
        x <= rect.x + rect.w + pad &&
        y >= rect.y - pad &&
        y <= rect.y + rect.h + pad
      ) {
        return p
      }
    }
    return null
  }

  boatAtDesignPoint(
    x: number,
    y: number,
    boatScreenRect: (b: BoatRuntime) => { x: number; y: number; w: number; h: number },
  ): number | null {
    // Front-most first: higher row then higher col (ortho paint order inverse)
    const ids = [...this.boats.keys()].sort((a, b) => {
      const ba = this.boats.get(a)!
      const bb = this.boats.get(b)!
      const sa = Math.max(...ba.cells.map((c) => c.r * GRID + c.c))
      const sb = Math.max(...bb.cells.map((c) => c.r * GRID + c.c))
      return sb - sa
    })
    for (const id of ids) {
      const boat = this.boats.get(id)!
      if (boat.hidden) {
        for (const cell of boat.cells) {
          const rect = cellRect(cell.c, cell.r)
          if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
            return id
          }
        }
        continue
      }
      const rect = boatScreenRect(boat)
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        return id
      }
    }
    return null
  }
}
