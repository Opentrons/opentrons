import chunk from 'lodash/chunk'

import { OT2_SINGLE_SLOT_ADDRESSABLE_AREAS } from '../constants'

import type { OT2AddressableAreaName } from '../../deck'
import type { DeckSlotId } from '../types'

// OT-2 slot rows in ascending order (front-to-back of robot deck)
const OT2_SLOT_ROWS = chunk(OT2_SINGLE_SLOT_ADDRESSABLE_AREAS, 3)

export const getOt2SurroundingSlots = (
  slot: OT2AddressableAreaName
): DeckSlotId[] => {
  const rowIndex = OT2_SLOT_ROWS.findIndex(row => row.includes(slot))
  let columnIndex = -1
  const surroundingSlots: DeckSlotId[] = []
  if (rowIndex >= 0) {
    columnIndex = OT2_SLOT_ROWS[rowIndex].indexOf(slot)
    const minRowIndexToSearch = Math.max(0, rowIndex - 1)
    const maxRowIndexToSearch = Math.min(OT2_SLOT_ROWS.length - 1, rowIndex + 1)
    const minColumnIndexToSearch = Math.max(0, columnIndex - 1)
    const maxColumnIndexToSearch = Math.min(
      OT2_SLOT_ROWS[0].length - 1,
      columnIndex + 1
    )
    for (const row of OT2_SLOT_ROWS.slice(
      minRowIndexToSearch,
      maxRowIndexToSearch + 1
    )) {
      for (const surroundingSlot of row.slice(
        minColumnIndexToSearch,
        maxColumnIndexToSearch + 1
      )) {
        if (surroundingSlot !== slot) {
          surroundingSlots.push(surroundingSlot)
        }
      }
    }
  }
  return surroundingSlots
}
