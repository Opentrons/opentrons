import * as React from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import { StaticRouter } from 'react-router-dom'
import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ChooseRobotToRunProtocolSlideout } from '../../../organisms/ChooseRobotToRunProtocolSlideout'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
import { getValidCustomLabwareFiles } from '../../../redux/custom-labware/selectors'
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

import type { Mock } from 'vitest'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

vi.mock('../../../redux/analytics')
vi.mock('../../../redux/custom-labware/selectors')
vi.mock('../../../redux/discovery/selectors')
vi.mock('../../../redux/protocol-storage/selectors')
vi.mock('../../../organisms/ChooseRobotToRunProtocolSlideout')
vi.mock('../../../organisms/SendProtocolToFlexSlideout')

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

let mockTrackEvent: Mock

describe('ProtocolDetails', () => {
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    vi.mocked(getValidCustomLabwareFiles).mockReturnValue([])
    vi.mocked(getConnectableRobots).mockReturnValue([mockConnectableRobot])
    vi.mocked(getUnreachableRobots).mockReturnValue([mockUnreachableRobot])
    vi.mocked(getReachableRobots).mockReturnValue([mockReachableRobot])
    vi.mocked(getScanning).mockReturnValue(false)

    vi.mocked(ChooseRobotToRunProtocolSlideout).mockReturnValue(
      <div>close ChooseRobotToRunProtocolSlideout</div>
    )
    vi.mocked(getIsProtocolAnalysisInProgress).mockReturnValue(false)
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
  })
  afterEach(() => {
    vi.resetAllMocks()
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
    screen.getByText('close ChooseRobotToRunProtocolSlideout')
  })
  it('opens choose robot to run protocol slideout when Start setup button is clicked', async () => {
    vi.mocked(ChooseRobotToRunProtocolSlideout).mockReturnValue(
      <div>open ChooseRobotToRunProtocolSlideout</div>
    )
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
    act(() => {
      runProtocolButton.click()
    })
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'ProtocolsDetail' },
      })
    })
    screen.getByText('open ChooseRobotToRunProtocolSlideout')
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
