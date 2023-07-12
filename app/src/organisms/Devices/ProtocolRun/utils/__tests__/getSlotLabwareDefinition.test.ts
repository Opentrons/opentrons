import { RunTimeCommand } from '@opentrons/shared-data'
import { mockDefinition } from '../../../../../redux/custom-labware/__fixtures__'
import { getSlotLabwareDefinition } from '../getSlotLabwareDefinition'

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
      definition: mockDefinition,
    },
  },
]

describe('getSlotLabwareDefinition', () => {
  it('returns labware definition for labwareId', () => {
    const expected = mockDefinition
    expect(
      getSlotLabwareDefinition(
        LABWARE_ID,
        MOCK_LOAD_LABWARE_COMMANDS as RunTimeCommand[]
      )
    ).toEqual(expected)
  })
})
