import * as deckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard'
// @flow
export const isValidSlot = (slot: string): boolean => {
  const slots: Array<string> = deckDef.locations.orderedSlots.map(
    slotDef => slotDef.id
  )
  return slots.includes(slot)
}
