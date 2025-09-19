import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import { getLabwareDefinitionUri } from '../getLabwareDefinitionUri'

import type { LabwareDefinition2, LoadedLabware } from '@opentrons/shared-data'

vi.mock('@opentrons/shared-data')

const MOCK_DEFINITION_URI = 'some_labware_definition_uri'
const MOCK_DEF: LabwareDefinition2 = {} as any

describe('getLabwareDefinitionUri', () => {
  beforeEach(() => {
    vi.mocked(getLabwareDefURI).mockReturnValue(MOCK_DEFINITION_URI)
  })
  it('should return the definition uri of a given labware', () => {
    const MOCK_LABWARE_ID = 'some_labware'
    const mockLabware = [
      {
        id: MOCK_LABWARE_ID,
        loadName: 'some loadname',
        definitionUri: MOCK_DEFINITION_URI,
        displayName: 'some dope labware',
      } as LoadedLabware,
    ]

    const mockLabwareDefinitionsByUri = {
      [MOCK_DEFINITION_URI]: MOCK_DEF,
    }
    expect(
      getLabwareDefinitionUri(
        MOCK_LABWARE_ID,
        mockLabware,
        mockLabwareDefinitionsByUri
      )
    ).toBe(MOCK_DEFINITION_URI)
  })
})
