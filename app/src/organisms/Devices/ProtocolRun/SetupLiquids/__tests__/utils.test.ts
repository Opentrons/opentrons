import {
  getWellFillFromLabwareId,
  getTotalVolumePerLiquidId,
  getTotalVolumePerLiquidLabwarePair,
  getLiquidsByIdForLabware,
  getWellGroupForLiquidId,
  getWellRangeForLiquidLabwarePair,
  getDisabledWellGroupForLiquidId,
} from '../utils'
import type { LabwareByLiquidId } from '@opentrons/api-client'
import type { LoadedLiquid } from '@opentrons/shared-data'

const LABWARE_ID =
  '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
const LIQUID_ID = '7'
const MOCK_LIQUIDS_IN_LOAD_ORDER: LoadedLiquid[] = [
  {
    description: 'water',
    displayColor: '#00d781',
    displayName: 'liquid 2',
    id: '7',
  },
  {
    description: 'saline',
    displayColor: '#0076ff',
    displayName: 'liquid 1',
    id: '123',
  },
  {
    description: 'reagent',
    displayColor: '#ff4888',
    displayName: 'liquid 3',
    id: '19',
  },
  {
    description: 'saliva',
    displayColor: '#B925FF',
    displayName: 'liquid 4',
    id: '4',
  },
]
const MOCK_LABWARE_BY_LIQUID_ID: LabwareByLiquidId = {
  '4': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A3: 100,
        A4: 100,
        B3: 100,
        B4: 100,
        C3: 100,
        C4: 100,
        D3: 100,
        D4: 100,
      },
    },
  ],
  '7': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A1: 100,
        A2: 100,
        B1: 100,
        B2: 100,
        C1: 100,
        C2: 100,
        D1: 100,
        D2: 100,
      },
    },
    {
      labwareId: '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      volumeByWell: {
        A3: 50,
        B1: 50,
        C1: 50,
        D1: 50,
      },
    },
  ],
  '19': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A5: 100,
        A6: 100,
        B5: 100,
        B6: 100,
        C5: 100,
        C6: 100,
        D5: 100,
        D6: 100,
      },
    },
  ],
  '123': [
    {
      labwareId:
        '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      volumeByWell: {
        A1: 1000,
      },
    },
  ],
}

const MOCK_LABWARE_BY_LIQUID_ID_FOR_LABWARE = {
  '4': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A3: 100,
        A4: 100,
        B3: 100,
        B4: 100,
        C3: 100,
        C4: 100,
        D3: 100,
        D4: 100,
      },
    },
  ],
  '7': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A1: 100,
        A2: 100,
        B1: 100,
        B2: 100,
        C1: 100,
        C2: 100,
        D1: 100,
        D2: 100,
      },
    },
  ],
  '19': [
    {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      volumeByWell: {
        A5: 100,
        A6: 100,
        B5: 100,
        B6: 100,
        C5: 100,
        C6: 100,
        D5: 100,
        D6: 100,
      },
    },
  ],
}

const MOCK_WELL_ORDERING = [
  ['A1', 'B1', 'C1', 'D1'],
  ['A2', 'B2', 'C2', 'D2'],
  ['A3', 'B3', 'C3', 'D3'],
  ['A4', 'B4', 'C4', 'D4'],
  ['A5', 'B5', 'C5', 'D5'],
  ['A6', 'B6', 'C6', 'D6'],
]
const MOCK_VOLUME_BY_WELL = {
  A1: 50,
  C5: 100,
  A3: 100,
  A4: 100,
  B3: 100,
  B4: 100,
  C3: 100,
  C4: 100,
  D3: 100,
  D4: 100,
}

describe('getWellFillFromLabwareId', () => {
  it('returns wellfill object for the labwareId', () => {
    const expected = {
      A1: '#00d781',
      A2: '#00d781',
      A3: '#B925FF',
      A4: '#B925FF',
      A5: '#ff4888',
      A6: '#ff4888',
      B1: '#00d781',
      B2: '#00d781',
      B3: '#B925FF',
      B4: '#B925FF',
      B5: '#ff4888',
      B6: '#ff4888',
      C1: '#00d781',
      C2: '#00d781',
      C3: '#B925FF',
      C4: '#B925FF',
      C5: '#ff4888',
      C6: '#ff4888',
      D1: '#00d781',
      D2: '#00d781',
      D3: '#B925FF',
      D4: '#B925FF',
      D5: '#ff4888',
      D6: '#ff4888',
    }
    expect(
      getWellFillFromLabwareId(
        LABWARE_ID,
        MOCK_LIQUIDS_IN_LOAD_ORDER,
        MOCK_LABWARE_BY_LIQUID_ID
      )
    ).toEqual(expected)
  })
})

describe('getTotalVolumePerLiquidId', () => {
  it('returns volume of liquid needed accross all labware', () => {
    const expected = 1000
    expect(
      getTotalVolumePerLiquidId(LIQUID_ID, MOCK_LABWARE_BY_LIQUID_ID)
    ).toEqual(expected)
  })
})

describe('getTotalVolumePerLiquidLabwarePair', () => {
  it('returns volume of liquid needed for a specific labware', () => {
    const expected = 800
    expect(
      getTotalVolumePerLiquidLabwarePair(
        LIQUID_ID,
        LABWARE_ID,
        MOCK_LABWARE_BY_LIQUID_ID
      )
    ).toEqual(expected)
  })
})

describe('getLiquidsByIdForLabware', () => {
  it('returns liquid info by labware id', () => {
    expect(
      getLiquidsByIdForLabware(LABWARE_ID, MOCK_LABWARE_BY_LIQUID_ID as any)
    ).toEqual(MOCK_LABWARE_BY_LIQUID_ID_FOR_LABWARE)
  })
})

describe('getWellGroupForLiquidId', () => {
  it('returns wellgroup object for the specified liquidId', () => {
    const expected = {
      A1: null,
      A2: null,
      B1: null,
      B2: null,
      C1: null,
      C2: null,
      D1: null,
      D2: null,
    }
    expect(
      getWellGroupForLiquidId(MOCK_LABWARE_BY_LIQUID_ID_FOR_LABWARE, '7')
    ).toEqual(expected)
  })
})

describe('getDisabledWellGroupForLiquidId', () => {
  it('returns wellgroup object for the specified liquidId', () => {
    const expectedSeven = {
      A1: null,
      A2: null,
      B1: null,
      B2: null,
      C1: null,
      C2: null,
      D1: null,
      D2: null,
    }

    const expectedNineteen = {
      A5: null,
      A6: null,
      B5: null,
      B6: null,
      C5: null,
      C6: null,
      D5: null,
      D6: null,
    }

    const expected = [expectedSeven, expectedNineteen]

    expect(
      getDisabledWellGroupForLiquidId(MOCK_LABWARE_BY_LIQUID_ID_FOR_LABWARE, [
        '7',
        '19',
      ])
    ).toEqual(expected)
  })
})

describe('getWellRangeForLiquidLabwarePair', () => {
  it('returns correctly ranged wells', () => {
    const expected = [
      { wellName: 'A1', volume: 50 },
      { wellName: 'A3: D3', volume: 100 },
      { wellName: 'A4: D4', volume: 100 },
      { wellName: 'C5', volume: 100 },
    ]
    expect(
      getWellRangeForLiquidLabwarePair(MOCK_VOLUME_BY_WELL, MOCK_WELL_ORDERING)
    ).toEqual(expected)
  })
})
