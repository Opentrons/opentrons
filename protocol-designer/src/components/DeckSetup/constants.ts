import { STANDARD_SLOT_LOAD_NAME } from '@opentrons/shared-data'

const cutouts = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3',
  'C1',
  'C2',
  'C3',
  'D1',
  'D2',
  'D3',
]

export const DEFAULT_SLOTS = cutouts.map((cutout, index) => ({
  fixtureId: (index + 1).toString(),
  fixtureLocation: cutout,
  loadName: STANDARD_SLOT_LOAD_NAME,
}))

export const VIEWBOX_MIN_X = -64
export const VIEWBOX_MIN_Y = -10
export const VIEWBOX_WIDTH = 520
export const VIEWBOX_HEIGHT = 414
