import type { BoatType, Facing } from './types'

const BASE = import.meta.env.BASE_URL
const ASSET_VERSION = 'port2d-20260920'

function url(path: string) {
  return `${BASE}${path.replace(/^\//, '')}?v=${ASSET_VERSION}`
}

export interface GameAssets {
  board: HTMLImageElement
  boats: Record<string, HTMLImageElement>
  ui: {
    undo: HTMLImageElement
    next: HTMLImageElement
    lockX: HTMLImageElement
    fog: HTMLImageElement
    shallow: HTMLImageElement
    pilot: HTMLImageElement
    cone: HTMLImageElement
    exitRight: HTMLImageElement
    exitDown: HTMLImageElement
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function boatKey(type: BoatType, free: boolean, facing: Facing): string {
  return `boat_${type}_${free ? 'free' : 'jam'}_${facing}`
}

export async function loadAssets(): Promise<GameAssets> {
  const boatTypes: BoatType[] = ['A_skiff', 'B_cabin', 'C_ferry', 'D_tug']
  const facings: Facing[] = ['right', 'down']
  const states = ['free', 'jam'] as const

  const boatEntries: [string, Promise<HTMLImageElement>][] = []
  for (const t of boatTypes) {
    for (const s of states) {
      for (const f of facings) {
        const key = `boat_${t}_${s}_${f}`
        boatEntries.push([key, loadImage(url(`assets/boats/${key}.png`))])
      }
    }
  }

  const [
    board,
    undo,
    next,
    lockX,
    fog,
    shallow,
    pilot,
    cone,
    exitRight,
    exitDown,
    ...boatImgs
  ] = await Promise.all([
    loadImage(url('assets/board_fullscreen_1080x1920.png')),
    loadImage(url('assets/ui/undo.png')),
    loadImage(url('assets/ui/next.png')),
    loadImage(url('assets/ui/lock_x.png')),
    loadImage(url('assets/ui/fog_overlay.png')),
    loadImage(url('assets/ui/shallow_hatch.png')),
    loadImage(url('assets/ui/pilot_badge.png')),
    loadImage(url('assets/ui/lighthouse_cone.png')),
    loadImage(url('assets/ui/exit_arrow_right.png')),
    loadImage(url('assets/ui/exit_arrow_down.png')),
    ...boatEntries.map(([, p]) => p),
  ])

  const boats: Record<string, HTMLImageElement> = {}
  boatEntries.forEach(([key], i) => {
    boats[key] = boatImgs[i]
  })

  return {
    board,
    boats,
    ui: { undo, next, lockX, fog, shallow, pilot, cone, exitRight, exitDown },
  }
}
