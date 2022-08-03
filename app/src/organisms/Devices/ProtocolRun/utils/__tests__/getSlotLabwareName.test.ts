import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getSlotLabwareName } from '../getSlotLabwareName'

const LABWARE_ID =
  '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
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

jest.mock('@opentrons/shared-data')
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>

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
