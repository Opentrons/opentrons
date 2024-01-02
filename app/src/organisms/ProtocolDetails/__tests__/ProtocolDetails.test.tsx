import * as React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { StaticRouter } from 'react-router-dom'
import { resetAllWhenMocks, when } from 'jest-when'

import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
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
import { getValidCustomLabwareFiles } from '../../../redux/custom-labware/selectors'
import { ChooseRobotToRunProtocolSlideout } from '../../ChooseRobotToRunProtocolSlideout'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/custom-labware/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/protocol-storage/selectors')
jest.mock('../../ChooseRobotToRunProtocolSlideout')

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
const mockGetIsProtocolAnalysisInProgress = getIsProtocolAnalysisInProgress as jest.MockedFunction<
  typeof getIsProtocolAnalysisInProgress
>
const mockGetValidCustomLabwareFiles = getValidCustomLabwareFiles as jest.MockedFunction<
  typeof getValidCustomLabwareFiles
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockChooseRobotToRunProtocolSlideout = ChooseRobotToRunProtocolSlideout as jest.MockedFunction<
  typeof ChooseRobotToRunProtocolSlideout
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

let mockTrackEvent: jest.Mock

describe('ProtocolDetails', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockGetValidCustomLabwareFiles.mockReturnValue([])
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)

    when(mockChooseRobotToRunProtocolSlideout)
      .calledWith(partialComponentPropsMatcher({ showSlideout: true }))
      .mockReturnValue(<div>open Slideout</div>)
    when(mockChooseRobotToRunProtocolSlideout)
      .calledWith(partialComponentPropsMatcher({ showSlideout: false }))
      .mockReturnValue(<div>close Slideout</div>)
    mockGetIsProtocolAnalysisInProgress.mockReturnValue(false)
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders protocol title as display name if present in metadata', () => {
    const protocolName = 'fakeProtocolDisplayName'
    render({
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
    screen.getByText('fakeProtocolDisplayName')
  })
  it('renders protocol title as file name if not in metadata', () => {
    render({
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
    expect(screen.getByText('fakeSrcFileName')).toBeInTheDocument()
  })
  it('renders deck view section', () => {
    render({
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
    expect(
      screen.getByRole('heading', { name: 'Deck View' })
    ).toBeInTheDocument()
    screen.getByText('close Slideout')
  })
  it('opens choose robot slideout when Start setup button is clicked', async () => {
    render({
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
    const runProtocolButton = screen.getByRole('button', {
      name: 'Start setup',
    })
    runProtocolButton.click()
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'ProtocolsDetail' },
      })
    })
    screen.getByText('open Slideout')
  })
  it('renders the protocol creation method', () => {
    render({
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
    screen.getByRole('heading', { name: 'creation method' })
    screen.getByText('Protocol Designer 6.0')
  })
  it('renders the last analyzed date', () => {
    render({
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
    screen.getByRole('heading', { name: 'last analyzed' })
  })
  it('renders the protocol description', () => {
    render({
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
    screen.getByRole('heading', { name: 'description' })
    screen.getByText('fake protocol description')
  })
})
