import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { when } from 'vitest-when'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useTrackCreateProtocolRunEvent } from '../../../organisms/Devices/hooks'
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
import { useFeatureFlag } from '../../../redux/config'
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { getNetworkInterfaces } from '../../../redux/networking'
import {
  storedProtocolData as storedProtocolDataFixture,
  storedProtocolDataWithCsvRunTimeParameter,
} from '../../../redux/protocol-storage/__fixtures__'
import { useCreateRunFromProtocol } from '../useCreateRunFromProtocol'
import { useOffsetCandidatesForAnalysis } from '../../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { ChooseRobotToRunProtocolSlideout } from '../'
import { useNotifyDataReady } from '../../../resources/useNotifyDataReady'

import type { State } from '../../../redux/types'

vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../organisms/ProtocolUpload/hooks')
vi.mock('../../../organisms/RunTimeControl/hooks')
vi.mock('../../../redux/discovery')
vi.mock('../../../redux/robot-update')
vi.mock('../../../redux/networking')
vi.mock('../../../redux/config')
vi.mock('../useCreateRunFromProtocol')
vi.mock('../../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis')
vi.mock('../../../resources/useNotifyDataReady')
vi.mock('../../../redux/config')

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

describe('ChooseRobotToRunProtocolSlideout', () => {
  let mockCloseCurrentRun = vi.fn()
  let mockResetCreateRun = vi.fn()
  let mockCreateRunFromProtocolSource = vi.fn()
  let mockTrackCreateProtocolRunEvent = vi.fn()
  beforeEach(() => {
    mockCloseCurrentRun = vi.fn()
    mockResetCreateRun = vi.fn()
    mockCreateRunFromProtocolSource = vi.fn()
    mockTrackCreateProtocolRunEvent = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: '',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    vi.mocked(getConnectableRobots).mockReturnValue([mockConnectableRobot])
    vi.mocked(getUnreachableRobots).mockReturnValue([mockUnreachableRobot])
    vi.mocked(getReachableRobots).mockReturnValue([mockReachableRobot])
    vi.mocked(getScanning).mockReturnValue(false)
    vi.mocked(startDiscovery).mockReturnValue({
      type: 'mockStartDiscovery',
    } as any)
    vi.mocked(useCloseCurrentRun).mockReturnValue({
      isClosingCurrentRun: false,
      closeCurrentRun: mockCloseCurrentRun,
    })
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    vi.mocked(useCurrentRunStatus).mockReturnValue(null)
    when(vi.mocked(useCreateRunFromProtocol))
      .calledWith(
        expect.any(Object),
        { hostname: expect.any(String) },
        expect.any(Array),
        expect.any(Object)
      )
      .thenReturn({
        createRunFromProtocolSource: mockCreateRunFromProtocolSource,
        reset: mockResetCreateRun,
      } as any)
    when(vi.mocked(useCreateRunFromProtocol))
      .calledWith(
        expect.any(Object),
        null,
        expect.any(Array),
        expect.any(Object)
      )
      .thenReturn({
        createRunFromProtocolSource: mockCreateRunFromProtocolSource,
        reset: mockResetCreateRun,
      } as any)
    vi.mocked(useTrackCreateProtocolRunEvent).mockReturnValue({
      trackCreateProtocolRunEvent: mockTrackCreateProtocolRunEvent,
    })
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, null)
      .thenReturn([])
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(
        storedProtocolDataFixture.mostRecentAnalysis,
        expect.any(String)
      )
      .thenReturn([])
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(
        storedProtocolDataWithCsvRunTimeParameter.mostRecentAnalysis,
        expect.any(String)
      )
      .thenReturn([])
    when(vi.mocked(getNetworkInterfaces))
      .calledWith({} as State, expect.any(String))
      .thenReturn({ wifi: null, ethernet: null })
    vi.mocked(useNotifyDataReady).mockReturnValue({} as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders slideout if showSlideout true', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    screen.getByText(/Choose Robot to Run/i)
    screen.getByText(/fakeSrcFileName/i)
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    vi.mocked(getUnreachableRobots).mockReturnValue([
      { ...mockUnreachableRobot, robotModel: 'OT-3 Standard' },
    ])
    vi.mocked(getReachableRobots).mockReturnValue([
      { ...mockReachableRobot, robotModel: 'OT-3 Standard' },
    ])
    screen.getByText('opentrons-robot-name')
    screen.getByText('2 unavailable or busy robots are not listed.')
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
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
      onCloseClick: vi.fn(),
      showSlideout: true,
    })[1]
    const refreshButton = screen.getByRole('button', { name: 'refresh' })
    fireEvent.click(refreshButton)
    expect(vi.mocked(startDiscovery)).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableRobot,
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })

    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot) // unselect default robot
    const mockRobot = screen.getByText('opentrons-robot-name')
    fireEvent.click(mockRobot)
    fireEvent.click(proceedButton)
    const confirm = screen.getByRole('button', { name: 'Confirm values' })
    expect(confirm).not.toBeDisabled()
    fireEvent.click(confirm)
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
  })
  it('if selected robot is on a different version of the software than the app, disable CTA and show link to device details in options', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    expect(proceedButton).toBeDisabled()
    screen.getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    const linkToRobotDetails = screen.getByText('Go to Robot')
    fireEvent.click(linkToRobotDetails)
  })

  it('renders error state when there is a run creation error', () => {
    vi.mocked(useCreateRunFromProtocol).mockReturnValue({
      runCreationError: 'run creation error',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: vi.fn(),
      runCreationErrorCode: 500,
    })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    fireEvent.click(proceedButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    // TODO( jr, 3.13.24): fix this when page 2 is completed of the multislideout
    // expect(screen.getByText('run creation error')).toBeInTheDocument()
  })

  it('renders error state when run creation error code is 409', () => {
    vi.mocked(useCreateRunFromProtocol).mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: vi.fn(),
      runCreationErrorCode: 409,
    })
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    const link = screen.getByRole('link', { name: 'Go to Robot' })
    fireEvent.click(link)
    expect(link.getAttribute('href')).toEqual('/devices/opentrons-robot-name')
    fireEvent.click(proceedButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    // TODO( jr, 3.13.24): fix this when page 2 is completed of the multislideout
    // screen.getByText(
    //   'This robot is busy and can’t run this protocol right now.'
    // )
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
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, '127.0.0.1')
      .thenReturn([mockOffsetCandidate])
    vi.mocked(getConnectableRobots).mockReturnValue([
      mockConnectableRobot,
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    expect(vi.mocked(useCreateRunFromProtocol)).toHaveBeenCalledWith(
      expect.any(Object),
      { hostname: '127.0.0.1' },
      [
        {
          vector: mockOffsetCandidate.vector,
          location: mockOffsetCandidate.location,
          definitionUri: mockOffsetCandidate.definitionUri,
        },
      ],
      {}
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    fireEvent.click(proceedButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
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
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, '127.0.0.1')
      .thenReturn([mockOffsetCandidate])
    when(vi.mocked(useOffsetCandidatesForAnalysis))
      .calledWith(storedProtocolDataFixture.mostRecentAnalysis, 'otherIp')
      .thenReturn([])
    vi.mocked(getConnectableRobots).mockReturnValue([
      mockConnectableRobot,
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
    ])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot) // unselect default robot

    expect(screen.getByRole('checkbox')).toBeChecked()
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    fireEvent.click(proceedButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
    expect(vi.mocked(useCreateRunFromProtocol)).nthCalledWith(
      2,
      expect.any(Object),
      { hostname: '127.0.0.1' },
      [
        {
          vector: mockOffsetCandidate.vector,
          location: mockOffsetCandidate.location,
          definitionUri: mockOffsetCandidate.definitionUri,
        },
      ],
      {}
    )
    expect(vi.mocked(useCreateRunFromProtocol)).toHaveBeenLastCalledWith(
      expect.any(Object),
      { hostname: 'otherIp' },
      [],
      {}
    )
  })

  it('disables proceed button if no available robots', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([])
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    expect(proceedButton).toBeDisabled()
  })

  it('renders labware offset data selection and learn more button launches help modal', () => {
    render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    screen.getByText('No offset data available')
    const learnMoreLink = screen.getByText('Learn more')
    fireEvent.click(learnMoreLink)
    screen.getByText(
      'Labware offset data references previous protocol run labware locations to save you time. If all the labware in this protocol have been checked in previous runs, that data will be applied to this run.'
    )
  })

  it('Disables confirm values button if file parameter missing', async () => {
    vi.mocked(useOffsetCandidatesForAnalysis).mockReturnValue([])
    render({
      storedProtocolData: storedProtocolDataWithCsvRunTimeParameter,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Continue to parameters',
    })
    fireEvent.click(proceedButton)
    const confirm = screen.getByRole('button', { name: 'Confirm values' })
    fireEvent.pointerEnter(confirm)
    await waitFor(() =>
      screen.findByText('Add the required CSV file to continue.')
    )
  })
})
