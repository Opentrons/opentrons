import * as React from 'react'
import '@testing-library/jest-dom'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
} from '../../../redux/discovery'
import { getIsProtocolAnalysisInProgress } from '../../../redux/protocol-storage/selectors'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { storedProtocolData } from '../../../redux/protocol-storage/__fixtures__'
import { ProtocolDetails } from '..'
import { DeckThumbnail } from '../../../molecules/DeckThumbnail'
import { getValidCustomLabwareFiles } from '../../../redux/custom-labware/selectors'
import { ChooseRobotSlideout } from '../../ChooseRobotSlideout'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

jest.mock('../../../redux/custom-labware/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/protocol-storage/selectors')
jest.mock('../../../molecules/DeckThumbnail')
jest.mock('../../../redux/config')
jest.mock('../../ChooseRobotSlideout')

const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>
const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockDeckThumbnail = DeckThumbnail as jest.MockedFunction<
  typeof DeckThumbnail
>
const mockGetIsProtocolAnalysisInProgress = getIsProtocolAnalysisInProgress as jest.MockedFunction<
  typeof getIsProtocolAnalysisInProgress
>
const mockGetValidCustomLabwareFiles = getValidCustomLabwareFiles as jest.MockedFunction<
  typeof getValidCustomLabwareFiles
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockChooseRobotSlideout = ChooseRobotSlideout as jest.MockedFunction<
  typeof ChooseRobotSlideout
>

const render = (
  props: Partial<React.ComponentProps<typeof ProtocolDetails>> = {}
) => {
  return renderWithProviders(
    <StaticRouter>
      <ProtocolDetails {...{ ...storedProtocolData, ...props }} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const protocolType = 'json'
const schemaVersion = 6
const author = 'Otie'
const createdAt = '2022-05-04T18:33:48.916159+00:00'
const description = 'fake protocol description'

const mockMostRecentAnalysis: ProtocolAnalysisOutput = storedProtocolData.mostRecentAnalysis as ProtocolAnalysisOutput

describe('ProtocolDetails', () => {
  beforeEach(() => {
    mockGetValidCustomLabwareFiles.mockReturnValue([])
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)
    mockDeckThumbnail.mockReturnValue(<div>mock Deck Thumbnail</div>)
    mockChooseRobotSlideout.mockImplementation(({ showSlideout }) =>
      showSlideout ? <div>mock Choose Robot Slideout</div> : null
    )
    mockGetIsProtocolAnalysisInProgress.mockReturnValue(false)
    when(mockUseFeatureFlag)
      .calledWith('enableLiquidSetup')
      .mockReturnValue(true)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders protocol title as display name if present in metadata', () => {
    const protocolName = 'fakeProtocolDisplayName'
    const { getByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
          protocolName,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    getByText('fakeProtocolDisplayName')
  })
  it('renders protocol title as file name if not in metadata', () => {
    const { getByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
          author,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    expect(getByText('fakeSrcFileName')).toBeInTheDocument()
  })
  it('renders deck setup section', () => {
    const { getByRole, getByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    expect(getByRole('heading', { name: 'deck setup' })).toBeInTheDocument()
    expect(getByText('mock Deck Thumbnail')).toBeInTheDocument()
  })
  it('opens choose robot slideout when run protocol button is clicked', () => {
    const { getByRole, getByText, queryByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    const runProtocolButton = getByRole('button', { name: 'Run protocol' })
    expect(queryByText('mock Choose Robot Slideout')).toBeNull()
    fireEvent.click(runProtocolButton)
    expect(getByText('mock Choose Robot Slideout')).toBeVisible()
  })
  it('renders the protocol creation method', () => {
    const { getByRole, getByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    getByRole('heading', { name: 'creation method' })
    getByText('Protocol Designer 6.0')
  })
  it('renders the last analyzed date', () => {
    const { getByRole } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    getByRole('heading', { name: 'last analyzed' })
  })
  it('renders the protocol description', () => {
    const { getByRole, getByText } = render({
      mostRecentAnalysis: {
        ...mockMostRecentAnalysis,
        createdAt,
        metadata: {
          ...mockMostRecentAnalysis.metadata,
          description,
        },
        config: {
          ...mockMostRecentAnalysis.config,
          protocolType,
          schemaVersion,
        },
      },
    })
    getByRole('heading', { name: 'description' })
    getByText('fake protocol description')
  })
})
