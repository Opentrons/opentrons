import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getLabwareDisplayName,
  LabwareDefinition2,
  ProtocolFile,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useCurrentProtocolRun } from '../../../../ProtocolUpload/hooks'
import { useProtocolDetails } from '../../../../RunDetails/hooks'
import { getLabwareLocation } from '../../../utils/getLabwareLocation'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getLabwareDefinitionUri } from '../../../utils/getLabwareDefinitionUri'

jest.mock('../../../../ProtocolUpload/hooks')
jest.mock('../../../utils/getLabwareLocation')
jest.mock('../../../../RunDetails/hooks')
jest.mock('../../../utils/getLabwareDefinitionUri')

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
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockGetLabwareDefinitionUri = getLabwareDefinitionUri as jest.MockedFunction<
  typeof getLabwareDefinitionUri
>
const MOCK_LABWARE_ID = 'some_labware_id'
const MOCK_LABWARE_DEFINITION_ID = 'some_labware_definition_id'
const MOCK_LABWARE_DEFINITION_URI = 'some_labware_definition_uri'
const MOCK_SLOT_NAME = '4'
const MOCK_LABWARE_VECTOR = { x: 1, y: 2, z: 3 }

describe('LabwareInfoOverlay', () => {
  let props: React.ComponentProps<typeof LabwareInfoOverlay>
  let labware: ProtocolFile<{}>['labware']
  let labwareDefinitions: ProtocolFile<{}>['labwareDefinitions']
  beforeEach(() => {
    props = {
      definition: fixture_tiprack_300_ul as LabwareDefinition2,
      labwareId: MOCK_LABWARE_ID,
    }
    labware = {
      [MOCK_LABWARE_ID]: {
        definitionId: MOCK_LABWARE_DEFINITION_ID,
      },
    }
    labwareDefinitions = {
      [MOCK_LABWARE_DEFINITION_ID]: fixture_tiprack_300_ul as LabwareDefinition2,
    }
    when(mockGetLabwareDisplayName)
      .calledWith(props.definition)
      .mockReturnValue('mock display name')

    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          commands: [],
          labware,
          labwareDefinitions,
          modules: [],
        },
      } as any)

    when(mockUseCurrentProtocolRun)
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

  it('should render the labware display name', () => {
    const { getByText } = render(props)
    getByText('mock display name')
  })

  it('should render NOT render the offset data label when offset data does not exist', () => {
    const { queryByText } = render(props)
    expect(queryByText('Labware Offsets')).toBeNull()
  })

  it('should render the offset data when offset data exists', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: {
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
        },
      } as any)
    const { getByText } = render(props)
    getByText('Offset Data')
    getByText(nestedTextMatcher('X1.0'))
    getByText(nestedTextMatcher('Y2.0'))
    getByText(nestedTextMatcher('Z3.0'))
  })
})
