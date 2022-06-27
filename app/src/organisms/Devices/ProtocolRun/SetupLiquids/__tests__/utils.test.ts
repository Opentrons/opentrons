import {
  getWellFillFromLabwareId,
  getTotalVolumePerLiquidId,
  getTotalVolumePerLiquidLabwarePair,
  getSlotLabwareName,
  getLiquidsByIdForLabware,
  getWellGroupForLiquidId,
} from '../utils'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import type { LabwareByLiquidId, Liquid } from '@opentrons/api-client'

const LABWARE_ID =
  '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
const LIQUID_ID = '7'
const MOCK_LIQUIDS_IN_LOAD_ORDER: Liquid[] = [
  {
    description: 'water',
    displayColor: '#00d781',
    displayName: 'liquid 2',
    liquidId: '7',
  },
  {
    description: 'saline',
    displayColor: '#0076ff',
    displayName: 'liquid 1',
    liquidId: '123',
  },
  {
    description: 'reagent',
    displayColor: '#ff4888',
    displayName: 'liquid 3',
    liquidId: '19',
  },
  {
    description: 'saliva',
    displayColor: '#B925FF',
    displayName: 'liquid 4',
    liquidId: '4',
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

const MOCK_LOAD_LABWARE_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        slotName: '5',
      },
    },
    result: {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      definition: {},
    },
  },
]

const MOCK_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        moduleId: '12345',
      },
    },
    result: {
      labwareId:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      definition: {},
    },
  },
  {
    commandType: 'loadModule',
    params: {
      location: {
        slotName: '4',
      },
    },
    result: {
      moduleId: '12345',
    },
  },
]

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

jest.mock('@opentrons/shared-data')
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>

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

describe('getSlotLabwareName', () => {
  beforeEach(() => {
    mockGetLabwareDisplayName.mockReturnValue(
      'Corning 24 Well Plate 3.4 mL Flat'
    )
  })
  it('returns labware name and slot number for labware id', () => {
    const expected = {
      slotName: '5',
      labwareName: 'Corning 24 Well Plate 3.4 mL Flat',
    }
    expect(
      getSlotLabwareName(LABWARE_ID, MOCK_LOAD_LABWARE_COMMANDS as any)
    ).toEqual(expected)
  })
  it('returns the module slot number if the labware is on a module', () => {
    const expected = {
      slotName: '4',
      labwareName: 'Corning 24 Well Plate 3.4 mL Flat',
    }
    expect(getSlotLabwareName(LABWARE_ID, MOCK_COMMANDS as any)).toEqual(
      expected
    )
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
