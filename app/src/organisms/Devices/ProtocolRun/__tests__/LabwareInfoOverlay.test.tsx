import * as React from 'react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import {
  getLabwareDisplayName,
  fixtureTiprack300ul,
} from '@opentrons/shared-data'
import {
  nestedTextMatcher,
  renderWithProviders,
} from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { useCurrentRun } from '../../../ProtocolUpload/hooks'
import { getLabwareLocation } from '../utils/getLabwareLocation'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getLabwareDefinitionUri } from '../utils/getLabwareDefinitionUri'
import { useLabwareOffsetForLabware } from '../useLabwareOffsetForLabware'
import type {
  LabwareDefinition2,
  ProtocolFile,
  LoadedLabware,
} from '@opentrons/shared-data'

vi.mock('../../../ProtocolUpload/hooks')
vi.mock('../utils/getLabwareLocation')
vi.mock('../../hooks')
vi.mock('../utils/getLabwareDefinitionUri')
vi.mock('../useLabwareOffsetForLabware')

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getLabwareDisplayName>()
  return {
    ...actual,
    getLabwareDisplayName: vi.fn(),
  }
})

const render = (props: React.ComponentProps<typeof LabwareInfoOverlay>) => {
  return renderWithProviders(
    <svg>
      <LabwareInfoOverlay {...props} />
    </svg>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const MOCK_LABWARE_ID = 'some_labware_id'
const MOCK_LABWARE_DEFINITION_URI = 'some_labware_definition_uri'
const MOCK_SLOT_NAME = '4'
const MOCK_LABWARE_VECTOR = { x: 1, y: 2, z: 3 }
const MOCK_RUN_ID = 'fake_run_id'

describe('LabwareInfoOverlay', () => {
  let props: React.ComponentProps<typeof LabwareInfoOverlay>
  let labware: LoadedLabware[]
  let labwareDefinitions: ProtocolFile<{}>['labwareDefinitions']
  beforeEach(() => {
    props = {
      definition: fixtureTiprack300ul as LabwareDefinition2,
      displayName: 'fresh tips',
      labwareId: MOCK_LABWARE_ID,
      runId: MOCK_RUN_ID,
    }
    labware = [
      {
        id: MOCK_LABWARE_ID,
        definitionUri: MOCK_LABWARE_DEFINITION_URI,
      } as LoadedLabware,
    ]
    labwareDefinitions = {
      [MOCK_LABWARE_DEFINITION_URI]: fixtureTiprack300ul as LabwareDefinition2,
    }
    when(vi.mocked(getLabwareDisplayName))
      .calledWith(props.definition)
      .thenReturn('mock definition display name')

    when(vi.mocked(useLabwareOffsetForLabware))
      .calledWith(MOCK_RUN_ID, MOCK_LABWARE_ID)
      .thenReturn({
        id: 'fake_offset_id',
        createdAt: 'fake_timestamp',
        definitionUri: 'fake_def_uri',
        location: { slotName: MOCK_SLOT_NAME },
        vector: MOCK_LABWARE_VECTOR,
      })

    when(vi.mocked(useCurrentRun))
      .calledWith()
      .thenReturn({} as any)

    when(vi.mocked(getLabwareLocation))
      .calledWith(MOCK_LABWARE_ID, [])
      .thenReturn({ slotName: MOCK_SLOT_NAME })

    when(vi.mocked(getLabwareDefinitionUri))
      .calledWith(MOCK_LABWARE_ID, labware, labwareDefinitions)
      .thenReturn(MOCK_LABWARE_DEFINITION_URI)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the labware display name if present', () => {
    const { getByText } = render(props)
    getByText('fresh tips')
  })

  it('should render the labware def display name if no user displayName present', () => {
    const { getByText } = render({
      ...props,
      displayName: null,
    })
    getByText('mock definition display name')
  })

  it('should render NOT render the offset data label when offset data does not exist', () => {
    const { queryByText } = render(props)
    expect(queryByText('Labware Offsets')).toBeNull()
  })

  it('should render the offset data when offset data exists', () => {
    when(vi.mocked(useCurrentRun))
      .calledWith()
      .thenReturn({
        data: {
          labwareOffsets: [
            {
              id: '1',
              definitionUri: MOCK_LABWARE_DEFINITION_URI,
              location: { slotName: MOCK_SLOT_NAME },
              vector: MOCK_LABWARE_VECTOR,
            },
          ],
        },
      } as any)
    const { getByText } = render(props)
    getByText('Offset Data')
    getByText(nestedTextMatcher('X1.0'))
    getByText(nestedTextMatcher('Y2.0'))
    getByText(nestedTextMatcher('Z3.0'))
  })
})
