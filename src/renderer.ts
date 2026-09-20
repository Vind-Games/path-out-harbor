import type { GameAssets } from './assets'
import { boatKey } from './assets'
import type { BoardState } from './board'
import type { BoatRuntime } from './types'
import {
  CHARGE_HUD,
  DESIGN_H,
  DESIGN_W,
  LEVEL_LABEL_Y,
  NEXT_RECT,
  SOFT_JAM_Y,
  TILE,
  UNDO_RECT,
  cellCenter,
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
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  const canvasX = cssX * sx
  const canvasY = cssY * sy
  return {
    x: (canvasX - view.offsetX) / view.scale,
    y: (canvasY - view.offsetY) / view.scale,
  }
}

/**
 * Ortho blit rect: top-left at min cell origin.
 * Sprites are exact TILE multiples (ASSET_SPECS); prefer natural size.
 */
export function boatBlitRect(boat: BoatRuntime, img: HTMLImageElement): {
  x: number
  y: number
  w: number
  h: number
} {
  const o = cellOrigin(boat.blitOrigin.c, boat.blitOrigin.r)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  return { x: o.x, y: o.y, w, h }
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
    this.exitAnim = {
      boat: { ...boat, cells: boat.cells.map((c) => ({ ...c })) },
      free,
      t0: performance.now(),
      dur: 280,
    }
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

    // Shallow hatches (ortho cell rects)
    for (const key of board.shallow) {
      const [cs, rs] = key.split(',').map(Number)
      const o = cellOrigin(cs, rs)
      ctx.drawImage(assets.ui.shallow, o.x, o.y, TILE, TILE)
    }

    // Cone pickups on board
    for (const p of board.conePickups) {
      const ctr = cellCenter(p.c, p.r)
      const cone = assets.ui.cone
      const cw = cone.width * 0.55
      const ch = cone.height * 0.55
      ctx.save()
      if (board.coneArmed) {
        ctx.shadowColor = 'rgba(255, 220, 80, 0.9)'
        ctx.shadowBlur = 18
      }
      ctx.drawImage(cone, ctr.x - cw / 2, ctr.y - ch * 0.75, cw, ch)
      ctx.restore()
    }

    // Boats: back-to-front by row then col
    const boats = [...board.boats.values()].sort((a, b) => {
      const sa = Math.min(...a.cells.map((c) => c.r * 100 + c.c))
      const sb = Math.min(...b.cells.map((c) => c.r * 100 + c.c))
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
        // Fog: overlay + light mist + big white ? on ortho cell rects
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const cell of boat.cells) {
          const o = cellOrigin(cell.c, cell.r)
          minX = Math.min(minX, o.x)
          minY = Math.min(minY, o.y)
          maxX = Math.max(maxX, o.x + TILE)
          maxY = Math.max(maxY, o.y + TILE)

          ctx.fillStyle = 'rgba(190, 210, 230, 0.28)'
          ctx.fillRect(o.x - 4, o.y - 4, TILE + 8, TILE + 8)

          const pad = TILE * 0.12
          ctx.globalAlpha = 0.92
          ctx.drawImage(
            assets.ui.fog,
            o.x - pad,
            o.y - pad,
            TILE + pad * 2,
            TILE + pad * 2,
          )
          ctx.globalAlpha = 1
        }
        const fcx = (minX + maxX) / 2
        const fcy = (minY + maxY) / 2
        ctx.font = 'bold 56px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillText('?', fcx + 2, fcy + 3)
        ctx.fillStyle = '#ffffff'
        ctx.fillText('?', fcx, fcy)
      } else {
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h)
        if (boat.pilotLinkId >= 0) {
          const badge = assets.ui.pilot
          const bx = rect.x + rect.w - badge.width * 0.55
          const by = rect.y - badge.height * 0.15
          ctx.drawImage(badge, bx, by, badge.width * 0.55, badge.height * 0.55)
        }
      }
      ctx.restore()
    }

    // Exit slide: facing right → +X (screen right); facing down → +Y (screen down)
    if (this.exitAnim) {
      const { boat, free, t0, dur } = this.exitAnim
      const t = Math.min(1, (now - t0) / dur)
      const img = assets.boats[boatKey(boat.type, free, boat.facing)]
      if (img) {
        const rect = boatBlitRect(boat, img)
        const dist = boat.facing === 'right' ? 480 : 420
        const dx = boat.facing === 'right' ? dist * t : 0
        const dy = boat.facing === 'down' ? dist * t : 0
        ctx.save()
        ctx.globalAlpha = 1 - t * 0.85
        ctx.drawImage(img, rect.x + dx, rect.y + dy, rect.w, rect.h)
        ctx.restore()
      }
      if (t >= 1) this.exitAnim = null
    }

    // Undo
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

    // Level label
    {
      ctx.font = 'bold 34px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = opts.levelLabel
      const tw = ctx.measureText(label).width
      const padX = 28
      const padY = 14
      const px = DESIGN_W / 2
      const py = LEVEL_LABEL_Y
      ctx.fillStyle = 'rgba(8, 18, 36, 0.72)'
      roundRect(ctx, px - tw / 2 - padX, py - 20 - padY / 2, tw + padX * 2, 40 + padY, 16)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.fillText(label, px, py)
    }

    // Soft-jam banner
    if (opts.softJam && !opts.showNext) {
      ctx.font = '28px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const msg = 'Jam — undo'
      const tw = ctx.measureText(msg).width
      ctx.fillStyle = 'rgba(40, 24, 8, 0.75)'
      roundRect(ctx, DESIGN_W / 2 - tw / 2 - 24, SOFT_JAM_Y - 22, tw + 48, 44, 14)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 200, 80, 0.95)'
      ctx.fillText(msg, DESIGN_W / 2, SOFT_JAM_Y)
    }

    // HUD lighthouse charges (top-right)
    if (board.lighthouseCharges > 0 || board.conePickups.length > 0) {
      const cone = assets.ui.cone
      const hx = CHARGE_HUD.x0
      const hy = CHARGE_HUD.y0
      ctx.fillStyle = board.coneArmed
        ? 'rgba(255, 210, 60, 0.35)'
        : 'rgba(8, 18, 36, 0.72)'
      roundRect(ctx, hx, hy, CHARGE_HUD.x1 - hx, CHARGE_HUD.y1 - hy, 14)
      ctx.fill()
      if (board.coneArmed) {
        ctx.strokeStyle = 'rgba(255, 220, 80, 0.95)'
        ctx.lineWidth = 3
        roundRect(ctx, hx, hy, CHARGE_HUD.x1 - hx, CHARGE_HUD.y1 - hy, 14)
        ctx.stroke()
      }
      const iw = 36
      const ih = (cone.height / cone.width) * iw
      ctx.drawImage(cone, hx + 14, hy + (CHARGE_HUD.y1 - hy - ih) / 2, iw, ih)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 36px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`×${board.lighthouseCharges}`, hx + 58, (hy + CHARGE_HUD.y1) / 2)
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
