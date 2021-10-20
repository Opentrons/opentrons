import * as React from 'react'

const getOffsetDataInfo = (): Array<{
  deckSlot: string
  labware: string
  offsetData: { x: number; y: number; z: number }
}> => [
  {
    deckSlot: 'Slot 1',
    labware: 'Opentrons 96 100mL Tiprack in Temperature Module GEN2',
    offsetData: { x: 1, y: 2, z: 3 },
  },
  {
    deckSlot: 'Slot 3',
    labware: 'Opentrons 96 Tip Rack 20µL',
    offsetData: { x: 0, y: 2, z: 1 },
  },
  {
    deckSlot: 'Slot 5',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 5, y: 2, z: 3 },
  },
  {
    deckSlot: 'Slot 6',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0, y: 0, z: 0 },
  },
  {
    deckSlot: 'Slot 7',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0, y: 0, z: 0 },
  },
]

export const SummaryScreen = (): JSX.Element => <div>summary screen</div>
