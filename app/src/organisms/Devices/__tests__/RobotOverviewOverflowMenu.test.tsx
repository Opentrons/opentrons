import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import * as Buildroot from '../../../redux/robot-update'
import { restartRobot } from '../../../redux/robot-admin'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { useCanDisconnect } from '../../../resources/networking/hooks'
import { DisconnectModal } from '../../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'
import { useIsRobotBusy } from '../hooks'
import { handleUpdateBuildroot } from '../RobotSettings/UpdateBuildroot'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-admin')
jest.mock('../hooks')
jest.mock('../../../redux/robot-update')
jest.mock('../../../resources/networking/hooks')
jest.mock(
  '../../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
)
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../RobotSettings/UpdateBuildroot')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockGetBuildrootUpdateDisplayInfo = Buildroot.getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getRobotUpdateDisplayInfo
>
const mockHome = home as jest.MockedFunction<typeof home>
const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockUpdateBuildroot = handleUpdateBuildroot as jest.MockedFunction<
  typeof handleUpdateBuildroot
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>
const mockDisconnectModal = DisconnectModal as jest.MockedFunction<
  typeof DisconnectModal
>
const mockUseCanDisconnect = useCanDisconnect as jest.MockedFunction<
  typeof useCanDisconnect
>

const render = (
  props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverviewOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('RobotOverviewOverflowMenu', () => {
  let props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
  jest.useFakeTimers()

  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    when(mockGetBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .mockReturnValue({
        autoUpdateAction: 'reinstall',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(false)
    when(mockUpdateBuildroot).mockReturnValue()
    when(mockChooseProtocolSlideout).mockReturnValue(
      <div>choose protocol slideout</div>
    )
    when(mockDisconnectModal).mockReturnValue(<div>mock disconnect modal</div>)
    when(mockUseCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue(true)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('should render enabled buttons in the menu when the status is idle', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const runAProtocolBtn = screen.getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = screen.getByRole('button', { name: 'Restart robot' })
    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    const disconnectBtn = screen.getByRole('button', {
      name: 'Disconnect from network',
    })
    const settingsBtn = screen.getByRole('button', { name: 'Robot settings' })

    expect(screen.queryByText('Update robot software')).toBeNull()
    expect(runAProtocolBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(disconnectBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('should render update robot software button when robot is on wrong version of software', () => {
    when(mockGetBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .mockReturnValue({
        autoUpdateAction: 'upgrade',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })

    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const updateRobotSoftwareBtn = screen.getByRole('button', {
      name: 'Update robot software',
    })
    const runAProtocolBtn = screen.getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = screen.getByRole('button', { name: 'Restart robot' })
    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    const settingsBtn = screen.getByRole('button', { name: 'Robot settings' })

    expect(updateRobotSoftwareBtn).toBeEnabled()
    expect(runAProtocolBtn).toBeDisabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
    fireEvent.click(updateRobotSoftwareBtn)
    expect(mockUpdateBuildroot).toHaveBeenCalled()
  })

  it('should render disabled run a protocol, restart, disconnect, and home gantry menu items when robot is busy', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)

    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    expect(
      screen.getByRole('button', { name: 'Run a protocol' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Disconnect from network' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })

  it('should render menu items when the robot is reachable', () => {
    render({ robot: mockReachableRobot })

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Disconnect from network' })
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })

  it('clicking home gantry should home the robot arm', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    expect(mockHome).toBeCalled()
  })

  it('should render disabled disconnect button in the menu when the robot cannot disconnect', () => {
    when(mockUseCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue(false)

    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const runAProtocolBtn = screen.getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = screen.getByRole('button', { name: 'Restart robot' })
    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    const disconnectBtn = screen.getByRole('button', {
      name: 'Disconnect from network',
    })
    const settingsBtn = screen.getByRole('button', { name: 'Robot settings' })

    expect(screen.queryByText('Update robot software')).toBeNull()
    expect(runAProtocolBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(disconnectBtn).toBeDisabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('clicking disconnect from network should launch the disconnect modal', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    expect(screen.queryByText('mock disconnect modal')).toBeNull()

    const disconnectBtn = screen.getByRole('button', {
      name: 'Disconnect from network',
    })
    fireEvent.click(disconnectBtn)

    screen.getByText('mock disconnect modal')
  })

  it('clicking the restart robot button should restart the robot', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const restartBtn = screen.getByRole('button', { name: 'Restart robot' })
    fireEvent.click(restartBtn)

    expect(mockRestartRobot).toBeCalled()
  })
  it('render overflow menu buttons without the update robot software button', () => {
    when(mockGetBuildrootUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    render(props)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(screen.queryByRole('Update robot software')).toBeNull()
    screen.getByRole('button', { name: 'Run a protocol' })
    screen.getByRole('button', { name: 'Restart robot' })
    screen.getByRole('button', { name: 'Home gantry' })
    screen.getByRole('button', { name: 'Disconnect from network' })
    screen.getByRole('button', { name: 'Robot settings' })
  })
  it('should disable settings link when the robot is unreachable', () => {
    render({ robot: mockUnreachableRobot })
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(
      screen.getByRole('button', { name: 'Robot settings' })
    ).toBeDisabled()
  })
})
