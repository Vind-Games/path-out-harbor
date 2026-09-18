import { BoardState } from '../src/board'
import { getLevel, levelCount } from '../src/levels'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

for (let i = 1; i <= levelCount(); i++) {
  const b = new BoardState()
  b.loadLevel(getLevel(i))
  assert(b.boats.size > 0, `L${i} empty`)
}
console.log(`Loaded ${levelCount()} levels OK`)

const board = new BoardState()
board.loadLevel(getLevel(1))
const boats = [...board.boats.values()]
console.log(
  'L1 initial:',
  boats.map((b) => `${b.type}@${b.cells[0].c},${b.cells[0].r} ${board.isPathClear(b.id) ? 'FREE' : 'JAM'}`).join(' | '),
)

const a = boats.find((b) => b.type === 'A_skiff')!
const bCabin = boats.find((b) => b.type === 'B_cabin')!
const c = boats.find((b) => b.type === 'C_ferry')!
const d = boats.find((b) => b.type === 'D_tug')!
assert(board.isPathClear(bCabin.id), 'B should be free')
assert(!board.isPathClear(a.id), 'A should be jam')
assert(board.isPathClear(d.id), 'D should be free')
assert(!board.isPathClear(c.id), 'C should be jam')

assert(board.tryExit(bCabin.id).ok, 'exit B')
assert(board.isPathClear(a.id), 'A frees after B')
assert(board.tryExit(a.id).ok, 'exit A')
assert(board.tryExit(d.id).ok, 'exit D')
assert(board.isPathClear(c.id), 'C frees after D')
assert(board.tryExit(c.id).ok, 'exit C')
assert(board.cleared, 'board cleared')
console.log('L1 solve B→A→D→C OK')

const fog = new BoardState()
fog.loadLevel(getLevel(13))
const visible = [...fog.boats.values()].find((x) => !x.hidden)!
const hidden = [...fog.boats.values()].find((x) => x.hidden)!
assert(fog.isPathClear(visible.id), 'visible free')
assert(!fog.canTap(hidden.id), 'cannot tap hidden')
const hidId = hidden.id
assert(fog.tryExit(visible.id).ok, 'exit visible')
const hid2 = fog.boats.get(hidId)!
assert(hid2 && !hid2.hidden, 'hidden revealed')
assert(fog.tryExit(hid2.id).ok, 'exit revealed')
assert(fog.cleared, 'fog cleared')
console.log('L13 fog reveal OK')

const pilot = new BoardState()
pilot.loadLevel(getLevel(15))
const skiff = [...pilot.boats.values()].find((x) => x.type === 'A_skiff')!
const ship = [...pilot.boats.values()].find((x) => x.requiresPilot)!
assert(pilot.isPathClear(skiff.id), 'skiff free')
assert(!pilot.isPathClear(ship.id), 'ship locked for pilot')
assert(pilot.tryExit(skiff.id).ok, 'exit skiff')
assert(pilot.isPathClear(ship.id), 'ship unlocked')
assert(pilot.tryExit(ship.id).ok, 'exit ship')
console.log('L15 pilot OK')

const sh = new BoardState()
sh.loadLevel(getLevel(17))
const sk = [...sh.boats.values()].find((x) => x.type === 'A_skiff')!
const cab = [...sh.boats.values()].find((x) => x.type === 'B_cabin')!
assert(sh.isPathClear(sk.id), 'skiff crosses shallow')
assert(sh.isPathClear(cab.id), 'cabin on deep free')
assert(sh.tryExit(sk.id).ok && sh.tryExit(cab.id).ok, 'shallow level clear')
console.log('L17 shallow OK')

const u = new BoardState()
u.loadLevel(getLevel(1))
const freeId = u.freeBoatIds()[0]
u.tryExit(freeId)
assert(u.canUndo() && u.undo() && u.boats.has(freeId), 'undo restores')
console.log('Undo OK')
console.log('SMOKE PASS')
