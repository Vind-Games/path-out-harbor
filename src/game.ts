import { loadAssets, type GameAssets } from './assets'
import { BoardState } from './board'
import { getLevel, levelCount } from './levels'
import { Renderer, clientToDesign, computeView, boatBlitRect } from './renderer'
import { DESIGN_H, DESIGN_W, NEXT_RECT, UNDO_RECT, type BoatRuntime } from './types'
import { boatKey } from './assets'

export class Game {
  private board = new BoardState()
  private assets!: GameAssets
  private renderer!: Renderer
  private view = computeView(DESIGN_W, DESIGN_H)
  private levelIndex = 1
  private showNext = false
  private busy = false
  private raf = 0
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async start() {
    this.assets = await loadAssets()
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('2D context unavailable')
    this.renderer = new Renderer(ctx, this.assets)

    const params = new URLSearchParams(location.search)
    const q = Number(params.get('level') || '1')
    this.loadLevel(Number.isFinite(q) ? q : 1)

    this.bindInput()
    this.resize()
    window.addEventListener('resize', () => this.resize())
    window.addEventListener('orientationchange', () => this.resize())

    const loop = () => {
      this.raf = requestAnimationFrame(loop)
      this.renderer.draw(this.board, this.view, {
        showNext: this.showNext,
        levelLabel: `Level ${this.levelIndex}/${levelCount()}`,
        softJam: this.board.isSoftJam(),
      })
    }
    loop()
  }

  private loadLevel(n: number) {
    this.levelIndex = Math.max(1, Math.min(levelCount(), n))
    const level = getLevel(this.levelIndex)
    this.board.loadLevel(level)
    this.showNext = false
    this.busy = false
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = window.innerWidth
    const cssH = window.innerHeight
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.canvas.width = Math.round(cssW * dpr)
    this.canvas.height = Math.round(cssH * dpr)
    this.view = computeView(this.canvas.width, this.canvas.height)
  }

  private boatRect = (b: BoatRuntime) => {
    const free = this.board.isPathClear(b.id)
    const img = this.assets.boats[boatKey(b.type, free || b.hidden, b.facing)]
      ?? this.assets.boats[boatKey(b.type, true, b.facing)]
    return boatBlitRect(b, img)
  }

  private bindInput() {
    const onPointer = (e: PointerEvent) => {
      e.preventDefault()
      if (this.busy || this.renderer.animating) return
      const { x, y } = clientToDesign(e.clientX, e.clientY, this.canvas, this.view)
      this.handleTap(x, y)
    }
    this.canvas.addEventListener('pointerdown', onPointer, { passive: false })
    // Safari older touch fallback
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) return
        e.preventDefault()
        if (this.busy || this.renderer.animating) return
        const t = e.touches[0]
        const { x, y } = clientToDesign(t.clientX, t.clientY, this.canvas, this.view)
        this.handleTap(x, y)
      },
      { passive: false },
    )
  }

  private inRect(
    x: number,
    y: number,
    r: { x0: number; y0: number; x1: number; y1: number },
  ) {
    return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1
  }

  private handleTap(x: number, y: number) {
    if (this.showNext) {
      const next = this.assets.ui.next
      const nx = (DESIGN_W - next.width) / 2
      const ny = NEXT_RECT.y0 + 10
      if (x >= nx && x <= nx + next.width && y >= ny && y <= ny + next.height) {
        this.advance()
        return
      }
      // Also accept NEXT_RECT
      if (this.inRect(x, y, NEXT_RECT)) {
        this.advance()
        return
      }
    }

    if (this.inRect(x, y, UNDO_RECT)) {
      this.board.undo()
      this.showNext = false
      return
    }

    if (this.showNext) return

    const id = this.board.boatAtDesignPoint(x, y, this.boatRect)
    if (id == null) return

    if (!this.board.canTap(id)) {
      this.renderer.pulse(id)
      return
    }

    if (!this.board.isPathClear(id)) {
      this.renderer.pulse(id)
      return
    }

    const boat = this.board.boats.get(id)!
    const snapshot: BoatRuntime = {
      ...boat,
      cells: boat.cells.map((c) => ({ ...c })),
    }
    this.busy = true
    this.renderer.startExit(snapshot, true)
    const result = this.board.tryExit(id)
    if (!result.ok) {
      this.busy = false
      this.renderer.pulse(id)
      return
    }
    window.setTimeout(() => {
      this.busy = false
      if (this.board.cleared) this.showNext = true
    }, 290)
  }

  private advance() {
    if (this.levelIndex >= levelCount()) {
      this.loadLevel(1)
    } else {
      this.loadLevel(this.levelIndex + 1)
    }
    const url = new URL(location.href)
    url.searchParams.set('level', String(this.levelIndex))
    history.replaceState(null, '', url.toString())
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }
}
