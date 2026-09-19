import type { BoatDef, Cell, Facing, LevelDef, BoatType } from './types'
import { footprintCells } from './types'

function o(c: number, r: number): Cell {
  return { c, r }
}

function boat(
  type: BoatType,
  facing: Facing,
  c: number,
  r: number,
  extra: Partial<BoatDef> = {},
): BoatDef {
  return {
    type,
    facing,
    origin: o(c, r),
    cells: footprintCells(type, facing, o(c, r)),
    ...extra,
  }
}

function boatCells(
  type: BoatType,
  facing: Facing,
  cells: Cell[],
  extra: Partial<BoatDef> = {},
): BoatDef {
  return { type, facing, cells, ...extra }
}

/** L1 per ASSET_SPECS top-down table:
 *  A @0,0 right; B @3,0 right; C @0,3 right; D @2,4 right.
 *  D collision truncated (cols 3–5) so C's (2,4) fits; sprite still blits at col 2.
 *  Live path: B free, A jam behind B, D free, C jam behind D. Solve: B→A→D→C.
 *  (ASSET_SPECS "free/jam" column is mock art labels; gameplay uses path-clear.) */
const L1: LevelDef = {
  id: 1,
  name: '1',
  boats: [
    boat('A_skiff', 'right', 0, 0),
    boat('B_cabin', 'right', 3, 0),
    boat('C_ferry', 'right', 0, 3),
    boatCells(
      'D_tug',
      'right',
      [o(3, 4), o(4, 4), o(5, 4), o(3, 5), o(4, 5), o(5, 5)],
      { blitOrigin: o(2, 4) },
    ),
  ],
}

/** L2: gate chain A→B→C + free red-herring H */
const L2: LevelDef = {
  id: 2,
  name: '2',
  boats: [
    boat('A_skiff', 'right', 4, 1),
    boat('B_cabin', 'right', 1, 1),
    boatCells('C_ferry', 'right', [o(0, 3), o(1, 3), o(2, 3), o(0, 4), o(1, 4), o(2, 4)]),
    boat('A_skiff', 'right', 0, 5),
  ],
}

/** L3: two freeables — B is correct gate for C; A is red-herring top chain */
const L3: LevelDef = {
  id: 3,
  name: '3',
  boats: [
    boat('A_skiff', 'right', 4, 1),
    boat('A_skiff', 'right', 2, 1),
    boatCells('D_tug', 'right', [o(0, 1), o(1, 1)]), // short nest boat
    boat('B_cabin', 'right', 2, 3),
    boatCells('C_ferry', 'right', [o(0, 3), o(1, 3), o(0, 4), o(1, 4)]),
  ],
}

/** L4: simple cross — right chain + down free */
const L4: LevelDef = {
  id: 4,
  name: '4',
  boats: [
    boat('A_skiff', 'right', 3, 0),
    boat('B_cabin', 'right', 0, 0),
    boat('A_skiff', 'down', 5, 1),
    boat('B_cabin', 'down', 5, 3),
  ],
}

/** L5: nest depth 2 + side free */
const L5: LevelDef = {
  id: 5,
  name: '5',
  boats: [
    boat('A_skiff', 'right', 4, 2),
    boat('B_cabin', 'right', 1, 2),
    boat('A_skiff', 'down', 0, 0),
    boat('A_skiff', 'right', 3, 5),
  ],
}

/** L6: ferry locked by cabin */
const L6: LevelDef = {
  id: 6,
  name: '6',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('B_cabin', 'right', 0, 0),
    boat('C_ferry', 'right', 0, 2),
    boat('A_skiff', 'right', 4, 4),
    boat('B_cabin', 'right', 0, 4),
  ],
}

/** L7: down-axis teach nest */
const L7: LevelDef = {
  id: 7,
  name: '7',
  boats: [
    boat('A_skiff', 'down', 1, 4),
    boat('B_cabin', 'down', 1, 1),
    boat('A_skiff', 'right', 3, 0),
    boat('A_skiff', 'right', 3, 2),
    boat('B_cabin', 'right', 3, 4),
  ],
}

/** L8: mixed axes pinch */
const L8: LevelDef = {
  id: 8,
  name: '8',
  boats: [
    boat('A_skiff', 'right', 4, 1),
    boat('B_cabin', 'right', 1, 1),
    boat('A_skiff', 'down', 0, 3),
    boat('A_skiff', 'down', 2, 3),
    boat('B_cabin', 'down', 4, 3),
  ],
}

/** L9: sacrifice / false-freeable — taking outer A first doesn't unlock C; need B first */
const L9: LevelDef = {
  id: 9,
  name: '9',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('B_cabin', 'right', 1, 0),
    boat('A_skiff', 'right', 4, 2),
    boat('A_skiff', 'right', 2, 2),
    boatCells('C_ferry', 'right', [o(0, 2), o(1, 2), o(0, 3), o(1, 3)]),
    boat('A_skiff', 'down', 5, 3),
  ],
}

/** L10: mid nest */
const L10: LevelDef = {
  id: 10,
  name: '10',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('A_skiff', 'right', 2, 0),
    boat('B_cabin', 'right', 0, 3),
    boat('A_skiff', 'down', 3, 2),
    boat('A_skiff', 'down', 5, 1),
    boat('B_cabin', 'down', 5, 3),
  ],
}

/** L11: patience pocket */
const L11: LevelDef = {
  id: 11,
  name: '11',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('B_cabin', 'right', 1, 0),
    boat('A_skiff', 'right', 4, 2),
    boat('B_cabin', 'right', 1, 2),
    boat('A_skiff', 'down', 0, 4),
    boat('A_skiff', 'right', 2, 5),
  ],
}

/** L12: cross-axis mid */
const L12: LevelDef = {
  id: 12,
  name: '12',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('A_skiff', 'right', 0, 0),
    boat('A_skiff', 'down', 2, 1),
    boat('B_cabin', 'down', 2, 3),
    boat('A_skiff', 'right', 4, 4),
    boat('A_skiff', 'right', 0, 5),
  ],
}

/** L13: fog teach — visible free reveals hidden neighbor */
const L13: LevelDef = {
  id: 13,
  name: 'FOG 1',
  boats: [
    boat('A_skiff', 'right', 2, 2),
    boat('A_skiff', 'right', 2, 3, { hidden: true }),
  ],
}

/** L14: lighthouse cone teach — fogged boat non-adjacent; spend cone to reveal */
const L14: LevelDef = {
  id: 14,
  name: 'FOG 2',
  lighthouseCharges: 1,
  conePickups: [o(0, 5)],
  boats: [
    boat('A_skiff', 'right', 0, 1),
    boat('A_skiff', 'right', 4, 4, { hidden: true }),
  ],
}

/** L15: pilot teach — skiff then tug */
const L15: LevelDef = {
  id: 15,
  name: 'PILOT 1',
  boats: [
    boat('A_skiff', 'right', 0, 1, { pilotLinkId: 1, gateId: 1 }),
    boatCells(
      'D_tug',
      'right',
      [o(0, 3), o(1, 3), o(2, 3), o(3, 3), o(0, 4), o(1, 4), o(2, 4), o(3, 4)],
      { pilotLinkId: 1, gateId: 1, requiresPilot: true },
    ),
  ],
}

/** L16: pilot with blocker */
const L16: LevelDef = {
  id: 16,
  name: 'PILOT 2',
  boats: [
    boat('A_skiff', 'right', 2, 1),
    boat('A_skiff', 'right', 0, 1, { pilotLinkId: 1, gateId: 1 }),
    boatCells(
      'D_tug',
      'right',
      [o(0, 3), o(1, 3), o(2, 3), o(3, 3), o(0, 4), o(1, 4), o(2, 4), o(3, 4)],
      { pilotLinkId: 1, gateId: 1, requiresPilot: true },
    ),
  ],
}

/** L17: shallow teach — skiff crosses hatch; cabin free on deep row */
const L17: LevelDef = {
  id: 17,
  name: 'SHALLOW 1',
  shallow: [o(2, 2), o(3, 2), o(4, 2)],
  boats: [
    boat('A_skiff', 'right', 0, 2),
    boat('B_cabin', 'right', 0, 4),
  ],
}

/** L18: cabin jammed by shallow on exit ray; skiff on deep row free */
const L18: LevelDef = {
  id: 18,
  name: 'SHALLOW 2',
  shallow: [o(3, 2), o(4, 2), o(5, 2)],
  boats: [
    boat('B_cabin', 'right', 0, 2),
    boat('A_skiff', 'right', 0, 4),
    boat('A_skiff', 'down', 5, 0),
  ],
}

/** L19: fog + pilot combo */
const L19: LevelDef = {
  id: 19,
  name: 'FOG+PILOT',
  boats: [
    boat('A_skiff', 'right', 0, 1),
    boat('A_skiff', 'right', 1, 2, { hidden: true, pilotLinkId: 1, gateId: 1 }),
    boatCells(
      'D_tug',
      'right',
      [o(0, 4), o(1, 4), o(2, 4), o(3, 4), o(0, 5), o(1, 5), o(2, 5), o(3, 5)],
      { pilotLinkId: 1, gateId: 1, requiresPilot: true },
    ),
  ],
}

/** L20: spike — nest + false freeable + down axis */
const L20: LevelDef = {
  id: 20,
  name: '20',
  boats: [
    boat('A_skiff', 'right', 4, 0),
    boat('A_skiff', 'right', 2, 0),
    boat('B_cabin', 'right', 0, 2),
    boat('A_skiff', 'right', 4, 2),
    boat('A_skiff', 'down', 5, 3),
    boat('B_cabin', 'down', 3, 3),
    boat('A_skiff', 'right', 0, 5),
  ],
}

export const LEVELS: LevelDef[] = [
  L1,
  L2,
  L3,
  L4,
  L5,
  L6,
  L7,
  L8,
  L9,
  L10,
  L11,
  L12,
  L13,
  L14,
  L15,
  L16,
  L17,
  L18,
  L19,
  L20,
]

export function getLevel(n: number): LevelDef {
  const idx = Math.max(1, Math.min(LEVELS.length, n)) - 1
  return LEVELS[idx]
}

export function levelCount() {
  return LEVELS.length
}
