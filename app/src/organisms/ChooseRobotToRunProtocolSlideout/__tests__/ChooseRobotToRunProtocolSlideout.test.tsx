import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { i18n } from '../../../i18n'
import {
  useProtocolDetailsForRun,
  useTrackCreateProtocolRunEvent,
} from '../../../organisms/Devices/hooks'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../../redux/discovery'
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { getNetworkInterfaces } from '../../../redux/networking'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useCreateRunFromProtocol } from '../useCreateRunFromProtocol'
import { useOffsetCandidatesForAnalysis } from '../../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { ChooseRobotToRunProtocolSlideout } from '../'

import type { ProtocolDetails } from '../../../organisms/Devices/hooks'
import type { State } from '../../../redux/types'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-update')
jest.mock('../../../redux/networking')
jest.mock('../../../redux/config')
jest.mock('../useCreateRunFromProtocol')
jest.mock('../../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis')

const mockUseOffsetCandidatesForAnalysis = useOffsetCandidatesForAnalysis as jest.MockedFunction<
  typeof useOffsetCandidatesForAnalysis
>
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
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseCreateRunFromProtocol = useCreateRunFromProtocol as jest.MockedFunction<
  typeof useCreateRunFromProtocol
>
const mockUseTrackCreateProtocolRunEvent = useTrackCreateProtocolRunEvent as jest.MockedFunction<
  typeof useTrackCreateProtocolRunEvent
>
const mockGetNetworkInterfaces = getNetworkInterfaces as jest.MockedFunction<
  typeof getNetworkInterfaces
>

const render = (
  props: React.ComponentProps<typeof ChooseRobotToRunProtocolSlideout>
) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseRobotToRunProtocolSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

let mockCloseCurrentRun: jest.Mock
let mockResetCreateRun: jest.Mock
let mockCreateRunFromProtocolSource: jest.Mock
let mockTrackCreateProtocolRunEvent: jest.Mock

describe('ChooseRobotToRunProtocolSlideout', () => {
  beforeEach(() => {
    mockCloseCurrentRun = jest.fn()
    mockResetCreateRun = jest.fn()
    mockCreateRunFromProtocolSource = jest.fn()
    mockTrackCreateProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: '',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)
    mockStartDiscovery.mockReturnValue({ type: 'mockStartDiscovery' } as any)
    mockUseCloseCurrentRun.mockReturnValue({
      isClosingCurrentRun: false,
      closeCurrentRun: mockCloseCurrentRun,
    })
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseCurrentRunStatus.mockReturnValue(null)
    mockUseProtocolDetailsForRun.mockReturnValue({
      displayName: 'A Protocol for Otie',
    } as ProtocolDetails)
    when(mockUseCreateRunFromProtocol)
      .calledWith(
        expect.any(Object),
        { hostname: expect.any(String) },
        expect.any(Array)
      )
      .mockReturnValue({
        createRunFromProtocolSource: mockCreateRunFromProtocolSource,
        reset: mockResetCreateRun,
      } as any)
    when(mockUseCreateRunFromProtocol)
      .calledWith(expect.any(Object), null, expect.any(Array))
      .mockReturnValue({
        createRunFromProtocolSource: mockCreateRunFromProtocolSource,
        reset: mockResetCreateRun,
      } as any)
    mockUseTrackCreateProtocolRunEvent.mockReturnValue({
      trackCreateProtocolRunEvent: mockTrackCreateProtocolRunEvent,
    })
    when(mockUseOffsetCandidatesForAnalysis)
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, null)
      .mockReturnValue([])
    when(mockUseOffsetCandidatesForAnalysis)
      .calledWith(
        storedProtocolDataFixture.mostRecentAnalysis,
        expect.any(String)
      )
      .mockReturnValue([])
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, expect.any(String))
      .mockReturnValue({ wifi: null, ethernet: null })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders slideout if showSlideout true', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    screen.getByText(/Choose Robot to Run/i)
    screen.getByText(/fakeSrcFileName/i)
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    screen.getByText('opentrons-robot-name')
    screen.getByText('2 unavailable robots are not listed.')
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    screen.getByText('opentrons-robot-name')
    expect(
      screen.queryByText('2 unavailable robots are not listed.')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const { dispatch } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })[1]
    const refreshButton = screen.getByRole('button', { name: 'refresh' })
    fireEvent.click(refreshButton)
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableRobot,
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    expect(proceedButton).not.toBeDisabled()
    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot) // unselect default robot
    expect(proceedButton).not.toBeDisabled()
    const mockRobot = screen.getByText('opentrons-robot-name')
    fireEvent.click(mockRobot)
    expect(proceedButton).not.toBeDisabled()
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
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
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    expect(proceedButton).toBeDisabled()
    screen.getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    const linkToRobotDetails = screen.getByText('Go to Robot')
    fireEvent.click(linkToRobotDetails)
  })

  it('renders error state when there is a run creation error', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'run creation error',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 500,
    })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    expect(screen.getByText('run creation error')).toBeInTheDocument()
  })

  it('renders error state when run creation error code is 409', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 409,
    })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    screen.getByText(
      'This robot is busy and can’t run this protocol right now.'
    )
    const link = screen.getByRole('link', { name: 'Go to Robot' })
    fireEvent.click(link)
    expect(link.getAttribute('href')).toEqual('/devices/opentrons-robot-name')
  })

  it('renders apply historic offsets as determinate if candidates available', () => {
    const mockOffsetCandidate = {
      id: 'third_offset_id',
      labwareDisplayName: 'Third Fake Labware Display Name',
      location: { slotName: '3' },
      vector: { x: 7, y: 8, z: 9 },
      definitionUri: 'thirdFakeDefURI',
      createdAt: '2022-05-11T13:34:51.012179+00:00',
      runCreatedAt: '2022-05-11T13:33:51.012179+00:00',
    }
    when(mockUseOffsetCandidatesForAnalysis)
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, '127.0.0.1')
      .mockReturnValue([mockOffsetCandidate])
    mockGetConnectableRobots.mockReturnValue([
      mockConnectableRobot,
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(mockUseCreateRunFromProtocol).toHaveBeenCalledWith(
      expect.any(Object),
      { hostname: '127.0.0.1' },
      [
        {
          vector: mockOffsetCandidate.vector,
          location: mockOffsetCandidate.location,
          definitionUri: mockOffsetCandidate.definitionUri,
        },
      ]
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
  })

  it('renders apply historic offsets as indeterminate if no candidates available', () => {
    const mockOffsetCandidate = {
      id: 'third_offset_id',
      labwareDisplayName: 'Third Fake Labware Display Name',
      location: { slotName: '3' },
      vector: { x: 7, y: 8, z: 9 },
      definitionUri: 'thirdFakeDefURI',
      createdAt: '2022-05-11T13:34:51.012179+00:00',
      runCreatedAt: '2022-05-11T13:33:51.012179+00:00',
    }
    when(mockUseOffsetCandidatesForAnalysis)
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, '127.0.0.1')
      .mockReturnValue([mockOffsetCandidate])
    when(mockUseOffsetCandidatesForAnalysis)
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, 'otherIp')
      .mockReturnValue([])
    mockGetConnectableRobots.mockReturnValue([
      mockConnectableRobot,
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot) // unselect default robot

    expect(screen.getByRole('checkbox')).toBeChecked()
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockUseCreateRunFromProtocol).nthCalledWith(
      2,
      expect.any(Object),
      { hostname: '127.0.0.1' },
      [
        {
          vector: mockOffsetCandidate.vector,
          location: mockOffsetCandidate.location,
          definitionUri: mockOffsetCandidate.definitionUri,
        },
      ]
    )
    expect(mockUseCreateRunFromProtocol).nthCalledWith(
      3,
      expect.any(Object),
      { hostname: 'otherIp' },
      []
    )
  })
})
