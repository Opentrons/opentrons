import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
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
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
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
import { getValidCustomLabwareFiles } from '../../../redux/custom-labware'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/ToasterOven')
jest.mock('../../../redux/robot-update')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/networking')
jest.mock('../../../redux/custom-labware')
jest.mock('../../../redux/protocol-storage/selectors')

const mockGetBuildrootUpdateDisplayInfo = getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof getRobotUpdateDisplayInfo
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
const mockGetValidCustomLabwareFiles = getValidCustomLabwareFiles as jest.MockedFunction<
  typeof getValidCustomLabwareFiles
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
const mockCustomLabwareFile: File = { path: 'fake_custom_labware_path' } as any

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
    when(mockGetValidCustomLabwareFiles)
      .calledWith({} as State)
      .mockReturnValue([mockCustomLabwareFile])
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders slideout title and button', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    screen.getByText('Send protocol to Opentrons Flex')
    screen.getByRole('button', { name: 'Send' })
  })

  it('renders an available robot option for every connectable OT-3, and link for other robots', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    mockGetUnreachableRobots.mockReturnValue([
      { ...mockUnreachableRobot, robotModel: 'OT-3 Standard' },
    ])
    mockGetReachableRobots.mockReturnValue([
      { ...mockUnreachableRobot, robotModel: 'OT-3 Standard' },
    ])
    screen.getByText('opentrons-robot-name')
    screen.getByText('2 unavailable robots are not listed.')
  })
  it('does render a robot option for a busy OT-3', () => {
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
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(screen.queryByText('opentrons-robot-name')).toBeInTheDocument()
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
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    expect(screen.queryByText('ot-2-robot-name')).not.toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    screen.getByText('opentrons-robot-name')
    expect(
      screen.queryByText('2 unavailable or busy robots are not listed.')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const { dispatch } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })[1]
    const refresh = screen.getByRole('button', { name: 'refresh' })
    fireEvent.click(refresh)
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableOT3, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableOT3,
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    const proceedButton = screen.getByRole('button', { name: 'Send' })
    expect(proceedButton).not.toBeDisabled()
    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot) // unselect default robot
    expect(proceedButton).not.toBeDisabled()
    const mockRobot = screen.getByText('opentrons-robot-name')
    fireEvent.click(mockRobot)
    expect(proceedButton).not.toBeDisabled()
    fireEvent.click(proceedButton)
    expect(mockMutateAsync).toBeCalledWith({
      files: [expect.any(Object), mockCustomLabwareFile],
      protocolKey: 'protocolKeyStub',
    })
  })
  it('if selected robot is on a different version of the software than the app, disable CTA and show link to device details in options', () => {
    when(mockGetBuildrootUpdateDisplayInfo)
      .calledWith(({} as any) as State, 'opentrons-robot-name')
      .mockReturnValue({
        autoUpdateAction: 'upgrade',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      isExpanded: true,
    })
    const proceedButton = screen.getByRole('button', { name: 'Send' })
    expect(proceedButton).toBeDisabled()
    expect(
      screen.getByText(
        'A robot software update is required to run protocols with this version of the Opentrons App.'
      )
    ).toBeInTheDocument()
    const linkToRobotDetails = screen.getByText('Go to Robot')
    fireEvent.click(linkToRobotDetails)
  })
})
