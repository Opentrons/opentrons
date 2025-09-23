import { describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  fixtureP100096V2Specs,
  fixtureTiprack300ul,
  NONE_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import { retrieveLiquidClassValues } from '../../utils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../../types'

const STATE: QuickTransferSummaryState = {
  pipette: fixtureP100096V2Specs,
  mount: 'left',
  tipRack: fixtureTiprack300ul as LabwareDefinition2,
  source: fixture96Plate as LabwareDefinition2,
  sourceWells: ['A1'],
  destination: fixture96Plate as LabwareDefinition2,
  destinationWells: ['A1'],
  transferType: 'transfer',
  volume: 10,
  aspirateFlowRate: 716,
  dispenseFlowRate: 716,
  path: 'single',
  tipPositionAspirate: 0,
  preWetTip: false,
  tipPositionDispense: 5,
  changeTip: 'once',
  dropTipLocation: { cutoutFixtureId: 'trashBinAdapter', cutoutId: 'cutoutA3' },
  liquidClassName: NONE_LIQUID_CLASS_NAME,
  liquidClassValuesInitialized: false,
}

describe('retrieveLiquidClassValues', () => {
  it('returns the correct shape and values for getNoLiquidClassValues', () => {
    const results = {
      aspirateFlowRate: 716,
      changeTip: 'once',
      destination: fixture96Plate as LabwareDefinition2,
      destinationWells: ['A1'],
      dispenseFlowRate: 716,
      dropTipLocation: {
        cutoutFixtureId: 'trashBinAdapter',
        cutoutId: 'cutoutA3',
      },
      liquidClassName: 'none',
      liquidClassValuesInitialized: false,
      mount: 'left',
      path: 'single',
      pipette: fixtureP100096V2Specs,
      preWetTip: false,
      source: fixture96Plate as LabwareDefinition2,
      sourceWells: ['A1'],
      tipPositionAspirate: 0,
      tipPositionDispense: 5,
      tipRack: fixtureTiprack300ul as LabwareDefinition2,
      transferType: 'transfer',
      volume: 10,
    }
    expect(retrieveLiquidClassValues(STATE, 'all')).toStrictEqual(results)
  })
})
