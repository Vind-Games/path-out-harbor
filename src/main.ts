import './style.css'
import { Game } from './game'

const canvas = document.getElementById('game') as HTMLCanvasElement
const game = new Game(canvas)
game.start().catch((err) => {
  console.error(err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML = `<pre style="color:#fcc;padding:24px;white-space:pre-wrap">${String(err)}</pre>`
  }
})
