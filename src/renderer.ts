import type { GameAssets } from './assets'
import { boatKey } from './assets'
import type { BoardState } from './board'
import type { BoatRuntime } from './types'
import {
  DESIGN_H,
  DESIGN_W,
  NEXT_RECT,
  TW,
  TH,
  UNDO_RECT,
  cellOrigin,
} from './types'

export interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
  canvasW: number
  canvasH: number
}

export function computeView(canvasW: number, canvasH: number): ViewTransform {
  const scale = Math.min(canvasW / DESIGN_W, canvasH / DESIGN_H)
  const drawW = DESIGN_W * scale
  const drawH = DESIGN_H * scale
  return {
    scale,
    offsetX: (canvasW - drawW) / 2,
    offsetY: (canvasH - drawH) / 2,
    canvasW,
    canvasH,
  }
}

/** Map client CSS pixel → design 1080×1920 space. */
export function clientToDesign(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  view: ViewTransform,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const cssX = clientX - rect.left
  const cssY = clientY - rect.top
  // Canvas backing store may differ from CSS size
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  const canvasX = cssX * sx
  const canvasY = cssY * sy
  return {
    x: (canvasX - view.offsetX) / view.scale,
    y: (canvasY - view.offsetY) / view.scale,
  }
}

/** Axis-aligned blit rect for a boat: center sprite on footprint AABB. */
export function boatBlitRect(boat: BoatRuntime, img: HTMLImageElement): {
  x: number
  y: number
  w: number
  h: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const cell of boat.cells) {
    const o = cellOrigin(cell.c, cell.r)
    minX = Math.min(minX, o.x)
    minY = Math.min(minY, o.y)
    maxX = Math.max(maxX, o.x + TW)
    maxY = Math.max(maxY, o.y + TH)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

export class Renderer {
  private pulseBoatId: number | null = null
  private pulseUntil = 0
  private exitAnim: {
    boat: BoatRuntime
    free: boolean
    t0: number
    dur: number
  } | null = null
  private ctx: CanvasRenderingContext2D
  private assets: GameAssets

  constructor(ctx: CanvasRenderingContext2D, assets: GameAssets) {
    this.ctx = ctx
    this.assets = assets
  }

  pulse(boatId: number) {
    this.pulseBoatId = boatId
    this.pulseUntil = performance.now() + 220
  }

  startExit(boat: BoatRuntime, free: boolean) {
    this.exitAnim = { boat: { ...boat, cells: boat.cells.map((c) => ({ ...c })) }, free, t0: performance.now(), dur: 280 }
  }

  get animating() {
    return this.exitAnim != null
  }

  draw(
    board: BoardState,
    view: ViewTransform,
    opts: { showNext: boolean; levelLabel: string; softJam: boolean },
  ) {
    const { ctx, assets } = this
    const { canvasW, canvasH, scale, offsetX, offsetY } = view
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvasW, canvasH)
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, canvasW, canvasH)

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)

    // Full-scene board — no invented chrome
    ctx.drawImage(assets.board, 0, 0, DESIGN_W, DESIGN_H)

    // Shallow hatches
    for (const key of board.shallow) {
      const [cs, rs] = key.split(',').map(Number)
      const o = cellOrigin(cs, rs)
      ctx.drawImage(assets.ui.shallow, o.x, o.y, TW, TH)
    }

    // Boats sorted back-to-front (low c+r first)
    const boats = [...board.boats.values()].sort((a, b) => {
      const sa = Math.min(...a.cells.map((c) => c.c + c.r))
      const sb = Math.min(...b.cells.map((c) => c.c + c.r))
      return sa - sb
    })

    const now = performance.now()
    for (const boat of boats) {
      const free = board.isPathClear(boat.id)
      const img = assets.boats[boatKey(boat.type, free, boat.facing)]
      if (!img) continue
      const rect = boatBlitRect(boat, img)

      ctx.save()
      if (this.pulseBoatId === boat.id && now < this.pulseUntil) {
        const t = 1 - (this.pulseUntil - now) / 220
        const shake = Math.sin(t * Math.PI * 6) * 6 * (1 - t)
        ctx.translate(shake, 0)
      }

      if (boat.hidden) {
        // Fog: draw fog overlays on cells; no boat tap target visually as boat
        for (const cell of boat.cells) {
          const o = cellOrigin(cell.c, cell.r)
          ctx.drawImage(assets.ui.fog, o.x, o.y, TW, TH)
        }
      } else {
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h)
        if (!free) {
          const lx = rect.x + rect.w / 2 - assets.ui.lockX.width / 2
          const ly = rect.y + rect.h / 2 - assets.ui.lockX.height / 2
          ctx.drawImage(assets.ui.lockX, lx, ly)
        }
        if (boat.pilotLinkId >= 0) {
          const badge = assets.ui.pilot
          const bx = rect.x + rect.w - badge.width * 0.55
          const by = rect.y - badge.height * 0.15
          ctx.drawImage(badge, bx, by, badge.width * 0.55, badge.height * 0.55)
        }
      }
      ctx.restore()
    }

    // Exit slide animation
    if (this.exitAnim) {
      const { boat, free, t0, dur } = this.exitAnim
      const t = Math.min(1, (now - t0) / dur)
      const img = assets.boats[boatKey(boat.type, free, boat.facing)]
      if (img) {
        const rect = boatBlitRect(boat, img)
        const dist = boat.facing === 'right' ? 420 : 360
        const dx = boat.facing === 'right' ? dist * t : 0
        const dy = boat.facing === 'down' ? dist * t : 0
        ctx.save()
        ctx.globalAlpha = 1 - t * 0.85
        ctx.drawImage(img, rect.x + dx, rect.y + dy, rect.w, rect.h)
        ctx.restore()
      }
      if (t >= 1) this.exitAnim = null
    }

    // Undo (board art may already paint a button; we overlay interactive sprite)
    const undo = assets.ui.undo
    const uw = UNDO_RECT.x1 - UNDO_RECT.x0
    const uh = UNDO_RECT.y1 - UNDO_RECT.y0
    ctx.globalAlpha = board.canUndo() ? 1 : 0.35
    ctx.drawImage(
      undo,
      UNDO_RECT.x0 + (uw - undo.width) / 2,
      UNDO_RECT.y0 + (uh - undo.height) / 2,
    )
    ctx.globalAlpha = 1

    // NEXT after clear
    if (opts.showNext) {
      const next = assets.ui.next
      const nx = (DESIGN_W - next.width) / 2
      const ny = NEXT_RECT.y0 + 10
      ctx.drawImage(next, nx, ny)
    }

    // Level label (minimal, top)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(opts.levelLabel, DESIGN_W / 2, 120)

    if (opts.softJam && !opts.showNext) {
      ctx.fillStyle = 'rgba(255, 200, 80, 0.9)'
      ctx.font = '28px system-ui, sans-serif'
      ctx.fillText('Jam — undo', DESIGN_W / 2, 170)
    }
  }
}
