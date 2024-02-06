import { describe, it, expect } from 'vitest'
import {
  fixture_tiprack_10_ul,
  fixture_tiprack_300_ul
} from '@opentrons/shared-data/labware/fixtures/2'
import { getTiprackOptions } from '../utils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { TiprackOption } from '../utils'

const fixtureTipRack10ul = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2

const fixtureTipRack300uL = {
  ...fixture_tiprack_300_ul,
  version: 2,
} as LabwareDefinition2

describe('getTiprackOptions', () => {
  it('renders tipracks with all tipracks is true', () => {
    const result = [
      {
        name: '300ul Tiprack FIXTURE',
        value: 'fixture/fixture_tiprack_300_ul/2',
      },
      {
        name: 'Opentrons GEB 10uL Tiprack',
        value: 'fixture/fixture_tiprack_10_ul/2',
      },
    ]
    const ten = '10uL'
    const threeHundred = '300uL'
    expect(
      getTiprackOptions({
        allLabware: {
          [ten]: fixtureTipRack10ul,
          [threeHundred]: fixtureTipRack300uL,
        },
        allowAllTipracks: true,
        selectedPipetteName: 'p10_single',
      })
    ).toEqual(result)
  })
  it('renders tipracks with all tipracks is false', () => {
    const result = [] as TiprackOption[]
    const ten = '10uL'
    const threeHundred = '300uL'
    expect(
      getTiprackOptions({
        allLabware: {
          [ten]: fixtureTipRack10ul,
          [threeHundred]: fixtureTipRack300uL,
        },
        allowAllTipracks: false,
        selectedPipetteName: 'p10_single',
      })
    ).toEqual(result)
  })
})
