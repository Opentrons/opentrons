import * as deckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

export const isValidSlot = (slot: string): boolean => {
  const slots: string[] = deckDef.locations.orderedSlots.map(
    (slotDef: { id: any }) => slotDef.id
  )
  return slots.includes(slot)
}
