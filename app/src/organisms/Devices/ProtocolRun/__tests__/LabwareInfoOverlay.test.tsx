import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getLabwareDisplayName,
  LabwareDefinition2,
  ProtocolFile,
  LoadedLabware,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useCurrentRun } from '../../../ProtocolUpload/hooks'
import { getLabwareLocation, getLabwareDefinitionUri } from '../utils'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { useLabwareOffsetForLabware } from '../useLabwareOffsetForLabware'

jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../utils/getLabwareLocation')
jest.mock('../../hooks')
jest.mock('../utils/getLabwareDefinitionUri')
jest.mock('../useLabwareOffsetForLabware')

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getLabwareDisplayName: jest.fn(),
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

const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>
const mockUseCurrentRun = useCurrentRun as jest.MockedFunction<
  typeof useCurrentRun
>
const mockUseLabwareOffsetForLabware = useLabwareOffsetForLabware as jest.MockedFunction<
  typeof useLabwareOffsetForLabware
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockGetLabwareDefinitionUri = getLabwareDefinitionUri as jest.MockedFunction<
  typeof getLabwareDefinitionUri
>
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
      definition: fixture_tiprack_300_ul as LabwareDefinition2,
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
      [MOCK_LABWARE_DEFINITION_URI]: fixture_tiprack_300_ul as LabwareDefinition2,
    }
    when(mockGetLabwareDisplayName)
      .calledWith(props.definition)
      .mockReturnValue('mock definition display name')

    when(mockUseLabwareOffsetForLabware)
      .calledWith(MOCK_RUN_ID, MOCK_LABWARE_ID)
      .mockReturnValue({
        id: 'fake_offset_id',
        createdAt: 'fake_timestamp',
        definitionUri: 'fake_def_uri',
        location: { slotName: MOCK_SLOT_NAME },
        vector: MOCK_LABWARE_VECTOR,
      })

    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({} as any)

    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, [])
      .mockReturnValue({ slotName: MOCK_SLOT_NAME })

    when(mockGetLabwareDefinitionUri)
      .calledWith(MOCK_LABWARE_ID, labware, labwareDefinitions)
      .mockReturnValue(MOCK_LABWARE_DEFINITION_URI)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
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
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
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
