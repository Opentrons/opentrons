import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { when } from 'jest-when'

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
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useFeatureFlag } from '../../../redux/config'
import { useCreateRunFromProtocol } from '../useCreateRunFromProtocol'
import { ChooseRobotSlideout } from '../'

import type { ProtocolDetails } from '../../../organisms/Devices/hooks'
import type { State } from '../../../redux/types'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/buildroot')
jest.mock('../../../redux/config')
jest.mock('../useCreateRunFromProtocol')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
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

const render = (props: React.ComponentProps<typeof ChooseRobotSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseRobotSlideout {...props} />
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

describe('ChooseRobotSlideout', () => {
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
    mockUseCreateRunFromProtocol.mockReturnValue({
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      reset: mockResetCreateRun,
    } as any)
    mockUseTrackCreateProtocolRunEvent.mockReturnValue({
      trackCreateProtocolRunEvent: mockTrackCreateProtocolRunEvent,
    })
    when(mockUseFeatureFlag)
      .calledWith('enableManualDeckStateModification')
      .mockReturnValue(true)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders slideout if showSlideout true', () => {
    const [{ queryAllByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run')).not.toBeFalsy()
    expect(queryAllByText('fakeSrcFileName')).not.toBeFalsy()
  })
  it('does not render slideout if showSlideout false', () => {
    const [{ queryAllByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run').length).toEqual(0)
    expect(queryAllByText('fakeSrcFileName').length).toEqual(0)
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable robots are not listed')
    ).toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable robots are not listed')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const [{ getByRole }, { dispatch }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const refreshButton = getByRole('button', { name: 'refresh' })
    fireEvent.click(refreshButton)
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableRobot,
    ])
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    expect(proceedButton).not.toBeDisabled()
    const otherRobot = getByText('otherRobot')
    otherRobot.click() // unselect default robot
    expect(proceedButton).not.toBeDisabled()
    const mockRobot = getByText('opentrons-robot-name')
    mockRobot.click()
    expect(proceedButton).not.toBeDisabled()
    proceedButton.click()
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
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    expect(proceedButton).toBeDisabled()
    expect(
      getByText(
        'A software update is available for this robot. Update to run protocols.'
      )
    ).toBeInTheDocument()
    const linkToRobotDetails = getByText('Go to Robot')
    linkToRobotDetails.click()
  })

  it('renders error state when there is a run creation error', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'run creation error',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 500,
    })
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    proceedButton.click()
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    expect(getByText('run creation error')).toBeInTheDocument()
  })

  it('renders error state when run creation error code is 409', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 409,
    })
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    proceedButton.click()
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    getByText('This robot is busy and can’t run this protocol right now.')
    const link = getByRole('link', { name: 'Go to Robot' })
    fireEvent.click(link)
    expect(link.getAttribute('href')).toEqual('/devices/opentrons-robot-name')
  })
})
