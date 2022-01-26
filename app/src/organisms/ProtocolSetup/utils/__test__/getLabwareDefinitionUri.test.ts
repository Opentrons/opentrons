import { getLabwareDefURI } from '@opentrons/shared-data'
import { getLabwareDefinitionUri } from '../getLabwareDefinitionUri'

describe('getLabwareDefinitionUri', () => {
  it('should return the definition uri of a given labware', () => {
    const MOCK_LABWARE_ID = 'some_labware'
    const MOCK_DEFINITION_URI = 'some_labware_definition_uri'
    const DEF_ID = `${MOCK_DEFINITION_URI}_id`
    const mockLabware = {
      [MOCK_LABWARE_ID]: {
        definitionId: `${MOCK_DEFINITION_URI}_id`,
        displayName: 'some dope labware',
      },
    }
    const mockLabwareDefinitions = {
      [DEF_ID]: {
        definition: {},
      },
    }
    expect(
      getLabwareDefinitionUri(
        MOCK_LABWARE_ID,
        mockLabware,
        mockLabwareDefinitions
      )
    ).toBe(MOCK_DEFINITION_URI)
  })
})
