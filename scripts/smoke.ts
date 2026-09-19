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
  boats
    .map(
      (b) =>
        `${b.type}@${b.cells[0].c},${b.cells[0].r} ${board.isPathClear(b.id) ? 'FREE' : 'JAM'}`,
    )
    .join(' | '),
)

const a = boats.find((b) => b.type === 'A_skiff')!
const bCabin = boats.find((b) => b.type === 'B_cabin')!
const c = boats.find((b) => b.type === 'C_ferry')!
const d = boats.find((b) => b.type === 'D_tug')!
assert(a.cells[0].c === 4 && a.cells[0].r === 0, 'A at cols 4–5 row 0')
assert(bCabin.cells[0].c === 1 && bCabin.cells[0].r === 0, 'B at cols 1–3 row 0')
assert(c.cells.some((x) => x.c === 0 && x.r === 3), 'C at 0,3')
assert(d.blitOrigin.c === 2 && d.blitOrigin.r === 4, 'D blitOrigin 2,4')
assert(board.isPathClear(a.id), 'A free (east edge cols 4–5)')
assert(!board.isPathClear(bCabin.id), 'B jam (blocked by A)')
assert(board.isPathClear(d.id), 'D should be free')
assert(!board.isPathClear(c.id), 'C should be jam')

assert(board.tryExit(a.id).ok, 'exit A')
assert(board.isPathClear(bCabin.id), 'B frees after A')
assert(board.tryExit(bCabin.id).ok, 'exit B')
assert(board.tryExit(d.id).ok, 'exit D')
assert(board.isPathClear(c.id), 'C frees after D')
assert(board.tryExit(c.id).ok, 'exit C')
assert(board.cleared, 'board cleared')
console.log('L1 solve A→B→D→C OK')

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
assert(fog.undo(), 'undo neighbor reveal')
assert(fog.boats.get(hidId)!.hidden, 'neighbor hidden restored')
assert(fog.tryExit(visible.id).ok, 'redo visible exit')
assert(fog.tryExit(hid2.id).ok, 'exit revealed')
assert(fog.cleared, 'fog cleared')
console.log('L13 fog neighbor reveal OK')

const cone = new BoardState()
cone.loadLevel(getLevel(14))
assert(cone.lighthouseCharges === 1, 'L14 has 1 charge')
assert(cone.conePickups.length === 1, 'L14 has cone pickup')
const vis14 = [...cone.boats.values()].find((x) => !x.hidden)!
const hid14 = [...cone.boats.values()].find((x) => x.hidden)!
assert(cone.isPathClear(vis14.id), 'L14 visible free')
assert(hid14.hidden, 'L14 fogged')
// Tap fog without arm = no reveal
assert(!cone.revealWithCone(hid14.id).ok, 'cannot reveal unarmed')
assert(hid14.hidden, 'still hidden')
// Arm from pickup then reveal
assert(cone.armConeAt(cone.conePickups[0].c, cone.conePickups[0].r), 'arm cone')
assert(cone.revealWithCone(hid14.id).ok, 'cone reveal')
assert(!hid14.hidden, 'revealed by cone')
assert(cone.lighthouseCharges === 0, 'charge spent')
assert(cone.tryExit(vis14.id).ok && cone.tryExit(hid14.id).ok, 'L14 clear')
assert(cone.cleared, 'L14 cleared')
console.log('L14 lighthouse cone OK')

// Undo restores fog + charge
const coneU = new BoardState()
coneU.loadLevel(getLevel(14))
const h = [...coneU.boats.values()].find((x) => x.hidden)!
coneU.armConeFromHud()
assert(coneU.revealWithCone(h.id).ok, 'reveal')
assert(coneU.undo(), 'undo reveal')
assert(h.hidden, 're-fogged')
assert(coneU.lighthouseCharges === 1, 'charge restored')
assert(coneU.conePickups.length === 1, 'pickup restored')
assert(coneU.coneArmed, 'armed state restored')
assert(!coneU.undo(), 'repeated undo is a no-op')
assert(coneU.revealWithCone(h.id).ok, 'can re-spend after undo')
console.log('Cone undo OK')

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

const sh2 = new BoardState()
sh2.loadLevel(getLevel(18))
const cab2 = [...sh2.boats.values()].find((x) => x.type === 'B_cabin')!
const sk2 = [...sh2.boats.values()].find((x) => x.type === 'A_skiff' && x.facing === 'right')!
assert(!sh2.isPathClear(cab2.id), 'cabin jammed by shallow')
assert(sh2.isPathClear(sk2.id), 'skiff free on deep')
console.log('L18 shallow block OK')

const u = new BoardState()
u.loadLevel(getLevel(1))
const freeId = u.freeBoatIds()[0]
u.tryExit(freeId)
assert(u.canUndo() && u.undo() && u.boats.has(freeId), 'undo restores')
console.log('Undo OK')
console.log('SMOKE PASS')
