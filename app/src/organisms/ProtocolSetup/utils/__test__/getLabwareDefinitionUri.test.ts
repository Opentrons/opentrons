import { getLabwareDefinitionUri } from '../getLabwareDefinitionUri'

describe('getLabwareDefinitionUri', () => {
  it('should return the definition uri of a given labware', () => {
    const MOCK_LABWARE_ID = 'some_labware'
    const MOCK_DEFINITION_URI = 'some_labware_definition_uri'
    const mockLabware = {
      [MOCK_LABWARE_ID]: {
        definitionId: `${MOCK_DEFINITION_URI}_id`,
        displayName: 'some dope labware',
      },
    }
    expect(getLabwareDefinitionUri(MOCK_LABWARE_ID, mockLabware)).toBe(
      MOCK_DEFINITION_URI
    )
  })
})
