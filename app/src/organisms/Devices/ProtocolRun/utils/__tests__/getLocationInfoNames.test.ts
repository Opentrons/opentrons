import { getLabwareDisplayName, ModuleModel } from '@opentrons/shared-data'
import { getLocationInfoNames } from '../getLocationInfoNames'

const ADAPTER_DISPLAY_NAME = 'Opentrons 96 Flat Bottom Adapter'
const LABWARE_DISPLAY_NAME = 'Corning 24 Well Plate 3.4 mL Flat'
const SLOT = '5'
const MOCK_MODEL = 'heaterShakerModuleV1' as ModuleModel
const ADAPTER_ID =
  'd9a85adf-d272-4edd-9aae-426ef5756fef:opentrons/opentrons_96_flat_bottom_adapter/1'
const LABWARE_ID =
  '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
const MOCK_LOAD_LABWARE_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        slotName: SLOT,
      },
    },
    result: {
      labwareId: LABWARE_ID,
      definition: {},
    },
  },
]
const MOCK_MOD_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        moduleId: '12345',
      },
    },
    result: {
      labwareId: LABWARE_ID,
      definition: {},
    },
  },
  {
    commandType: 'loadModule',
    params: {
      location: {
        slotName: SLOT,
      },
      model: MOCK_MODEL,
    },
    result: {
      moduleId: '12345',
    },
  },
]
const MOCK_ADAPTER_MOD_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        moduleId: '12345',
      },
    },
    result: {
      labwareId: ADAPTER_ID,
      definition: {
        metadata: { displayName: ADAPTER_DISPLAY_NAME },
      },
    },
  },
  {
    commandType: 'loadLabware',
    params: {
      location: {
        labwareId: ADAPTER_ID,
      },
    },
    result: {
      labwareId: LABWARE_ID,
      definition: {},
    },
  },
  {
    commandType: 'loadModule',
    params: {
      location: {
        slotName: SLOT,
      },
      model: MOCK_MODEL,
    },
    result: {
      moduleId: '12345',
    },
  },
]
const MOCK_ADAPTER_COMMANDS = [
  {
    commandType: 'loadLabware',
    params: {
      location: {
        slotName: SLOT,
      },
    },
    result: {
      labwareId: ADAPTER_ID,
      definition: {
        metadata: { displayName: ADAPTER_DISPLAY_NAME },
      },
    },
  },
  {
    commandType: 'loadLabware',
    params: {
      location: {
        labwareId: ADAPTER_ID,
      },
    },
    result: {
      labwareId: LABWARE_ID,
      definition: {},
    },
  },
]

jest.mock('@opentrons/shared-data')
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>

describe('getLocationInfoNames', () => {
  beforeEach(() => {
    mockGetLabwareDisplayName.mockReturnValue(LABWARE_DISPLAY_NAME)
  })
  it('returns labware name and slot number for labware id on the deck', () => {
    const expected = {
      slotName: SLOT,
      labwareName: LABWARE_DISPLAY_NAME,
    }
    expect(
      getLocationInfoNames(LABWARE_ID, MOCK_LOAD_LABWARE_COMMANDS as any)
    ).toEqual(expected)
  })
  it('returns the module slot number if the labware is on a module', () => {
    const expected = {
      slotName: SLOT,
      labwareName: LABWARE_DISPLAY_NAME,
      moduleModel: MOCK_MODEL,
    }
    expect(getLocationInfoNames(LABWARE_ID, MOCK_MOD_COMMANDS as any)).toEqual(
      expected
    )
  })
  it('returns the adapter, module, slot number if the labware is on an adapter on a module', () => {
    const expected = {
      slotName: SLOT,
      labwareName: LABWARE_DISPLAY_NAME,
      moduleModel: MOCK_MODEL,
      adapterName: ADAPTER_DISPLAY_NAME,
    }
    expect(
      getLocationInfoNames(LABWARE_ID, MOCK_ADAPTER_MOD_COMMANDS as any)
    ).toEqual(expected)
  })
  it('returns the adapter, slot number if the labware is on an adapter on the deck', () => {
    const expected = {
      slotName: SLOT,
      labwareName: LABWARE_DISPLAY_NAME,
      adapterName: ADAPTER_DISPLAY_NAME,
    }
    expect(
      getLocationInfoNames(LABWARE_ID, MOCK_ADAPTER_COMMANDS as any)
    ).toEqual(expected)
  })
})
