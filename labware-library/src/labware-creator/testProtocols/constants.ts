import type { Options } from '../fields'

interface Pipette {
  displayName: string
  tiprack: string
}

export const pipettes: Record<string, Pipette> = {
  p20_single_gen2: {
    displayName: 'P20 Single GEN2',
    tiprack: 'opentrons_96_tiprack_20ul',
  },
  p300_single_gen2: {
    displayName: 'P300 Single GEN2',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  p1000_single_gen2: {
    displayName: 'P1000 Single GEN2',
    tiprack: 'opentrons_96_tiprack_1000ul',
  },
  p10_single: {
    displayName: 'P10 Single GEN1',
    tiprack: 'opentrons_96_tiprack_20ul',
  },
  p50_single: {
    displayName: 'P50 Single GEN1',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  p300_single: {
    displayName: 'P300 Single GEN1',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  p1000_single: {
    displayName: 'P1000 Single GEN1',
    tiprack: 'opentrons_96_tiprack_1000ul',
  },
}

export const pipetteNameOptions: Options = Object.keys(
  pipettes
).map(loadName => ({ name: pipettes[loadName].displayName, value: loadName }))
