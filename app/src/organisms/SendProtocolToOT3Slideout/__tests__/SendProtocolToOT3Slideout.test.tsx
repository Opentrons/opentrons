import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '@opentrons/discovery-client/src/__fixtures__'

import { i18n } from '../../../i18n'
import { useToast } from '../../../atoms/Toast'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { SendProtocolToOT3Slideout } from '..'

jest.mock('../../../atoms/Toast')
jest.mock('../../../redux/buildroot')
jest.mock('../../../redux/discovery')

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
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

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
}
const mockReachableOT3 = {
  ...mockReachableRobot,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
}
const mockUnreachableOT3 = {
  ...mockUnreachableRobot,
  health: mockOT3HealthResponse,
  serverHealth: mockOT3ServerHealthResponse,
}

const mockMakeToast = jest.fn()
const mockEatToast = jest.fn()

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
    when(mockUseToast).calledWith().mockReturnValue({
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  const PROTOCOL_DISPLAY_NAME = 'A Protocol for Otie'

  it('renders slideout title and button', () => {
    const [{ getByRole, getByText }] = render({
      protocolDisplayName: PROTOCOL_DISPLAY_NAME,
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    getByText('Send protocol to an OT-3')
    getByRole('button', { name: 'Send' })
  })

  it('renders an available robot option for every connectable OT-3, and link for other robots', () => {
    const [{ queryByText }] = render({
      protocolDisplayName: PROTOCOL_DISPLAY_NAME,
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable robots are not listed.')
    ).toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ queryByText }] = render({
      protocolDisplayName: PROTOCOL_DISPLAY_NAME,
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable robots are not listed.')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const [{ getByRole }, { dispatch }] = render({
      protocolDisplayName: PROTOCOL_DISPLAY_NAME,
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
      protocolDisplayName: PROTOCOL_DISPLAY_NAME,
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
  })
})
