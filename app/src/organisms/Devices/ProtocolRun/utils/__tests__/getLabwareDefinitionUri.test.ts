import { getLabwareDefURI, LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDefinitionUri } from '../getLabwareDefinitionUri'

jest.mock('@opentrons/shared-data')

const mockGetLabareDefURI = getLabwareDefURI as jest.MockedFunction<
  typeof getLabwareDefURI
>

const MOCK_DEFINITION_URI = 'some_labware_definition_uri'
const MOCK_DEF: LabwareDefinition2 = {} as any

describe('getLabwareDefinitionUri', () => {
  beforeEach(() => {
    mockGetLabareDefURI.mockReturnValue(MOCK_DEFINITION_URI)
  })
  it('should return the definition uri of a given labware', () => {
    const MOCK_LABWARE_ID = 'some_labware'
    const mockLabware = {
      [MOCK_LABWARE_ID]: {
        definitionUri: MOCK_DEFINITION_URI,
        displayName: 'some dope labware',
      },
    }
    const mockLabwareDefinitions = {
      [MOCK_DEFINITION_URI]: MOCK_DEF,
    }
    expect(
      getLabwareDefinitionUri(
        MOCK_LABWARE_ID,
        //  @ts-expect-error
        mockLabware,
        mockLabwareDefinitions
      )
    ).toBe(MOCK_DEFINITION_URI)
  })
})
