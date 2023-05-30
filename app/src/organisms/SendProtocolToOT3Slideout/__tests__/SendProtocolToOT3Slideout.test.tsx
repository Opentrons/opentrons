import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '@opentrons/discovery-client/src/__fixtures__'
import {
  useAllRunsQuery,
  useCreateProtocolMutation,
} from '@opentrons/react-api-client'

import { mockSuccessQueryResults } from '../../../__fixtures__'
import { i18n } from '../../../i18n'
import { useToaster } from '../../../organisms/ToasterOven'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
} from '../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { getNetworkInterfaces } from '../../../redux/networking'
import { getIsProtocolAnalysisInProgress } from '../../../redux/protocol-storage/selectors'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { SendProtocolToOT3Slideout } from '..'

import type { State } from '../../../redux/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/ToasterOven')
jest.mock('../../../redux/buildroot')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/networking')
jest.mock('../../../redux/protocol-storage/selectors')

const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>
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
const mockStartDiscovery = startDiscovery as jest.MockedFunction<
  typeof startDiscovery
>
const mockUseToaster = useToaster as jest.MockedFunction<typeof useToaster>
const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>
const mockUseCreateProtocolMutation = useCreateProtocolMutation as jest.MockedFunction<
  typeof useCreateProtocolMutation
>
const mockGetIsProtocolAnalysisInProgress = getIsProtocolAnalysisInProgress as jest.MockedFunction<
  typeof getIsProtocolAnalysisInProgress
>
const mockGetNetworkInterfaces = getNetworkInterfaces as jest.MockedFunction<
  typeof getNetworkInterfaces
>

const render = (
  props: React.ComponentProps<typeof SendProtocolToOT3Slideout>
) => {
  return renderWithProviders(
    <StaticRouter>
      <SendProtocolToOT3Slideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockConnectableOT3 = {
  ...mockConnectableRobot,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  robotModel: ROBOT_MODEL_OT3,
}
const mockReachableOT3 = {
  ...mockReachableRobot,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  robotModel: ROBOT_MODEL_OT3,
}
const mockUnreachableOT3 = {
  ...mockUnreachableRobot,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
  robotModel: ROBOT_MODEL_OT3,
}

const mockMakeSnackbar = jest.fn()
const mockMakeToast = jest.fn()
const mockEatToast = jest.fn()
const mockMutateAsync = jest.fn()

describe('SendProtocolToOT3Slideout', () => {
  beforeEach(() => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: '',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockGetConnectableRobots.mockReturnValue([mockConnectableOT3])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableOT3])
    mockGetReachableRobots.mockReturnValue([mockReachableOT3])
    mockGetScanning.mockReturnValue(false)
    mockStartDiscovery.mockReturnValue({ type: 'mockStartDiscovery' } as any)
    mockGetIsProtocolAnalysisInProgress.mockReturnValue(false)
    when(mockUseToaster).calledWith().mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    })
    when(mockUseAllRunsQuery)
      .calledWith(expect.any(Object), expect.any(Object), expect.any(Object))
      .mockReturnValue(
        mockSuccessQueryResults({
          data: [],
          links: {},
        })
      )
    when(mockUseCreateProtocolMutation)
      .calledWith(expect.any(Object), expect.any(Object))
      .mockReturnValue({ mutateAsync: mockMutateAsync } as any)
    when(mockMutateAsync).mockImplementation(() => Promise.resolve())
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, expect.any(String))
      .mockReturnValue({ wifi: null, ethernet: null })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders slideout title and button', () => {
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    getByText('Send protocol to Opentrons Flex')
    getByRole('button', { name: 'Send' })
  })

  it('renders an available robot option for every connectable OT-3, and link for other robots', () => {
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable or busy robots are not listed.')
    ).toBeInTheDocument()
  })
  it('does not render a robot option for a busy OT-3', () => {
    when(mockUseAllRunsQuery)
      .calledWith(expect.any(Object), expect.any(Object), {
        hostname: mockConnectableOT3.ip,
      })
      .mockReturnValue(
        mockSuccessQueryResults({
          data: [],
          links: { current: { href: 'a current run' } },
        })
      )
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('opentrons-robot-name')).not.toBeInTheDocument()
  })
  it('does not render an available robot option for a connectable OT-2', () => {
    mockGetConnectableRobots.mockReturnValue([
      mockConnectableOT3,
      {
        ...mockConnectableRobot,
        name: 'ot-2-robot-name',
        robotModel: ROBOT_MODEL_OT2,
      },
    ])
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('ot-2-robot-name')).not.toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable or busy robots are not listed.')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const [{ getByRole }, { dispatch }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    getByRole('button', { name: 'refresh' }).click()
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableOT3, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableOT3,
    ])
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    const sendButton = getByRole('button', { name: 'Send' })
    expect(sendButton).not.toBeDisabled()
    const otherRobot = getByText('otherRobot')
    otherRobot.click() // unselect default robot
    expect(sendButton).not.toBeDisabled()
    const mockRobot = getByText('opentrons-robot-name')
    mockRobot.click()
    expect(sendButton).not.toBeDisabled()
    sendButton.click()
    expect(mockMutateAsync).toBeCalled()
  })
})
