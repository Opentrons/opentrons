import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'

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
import { useIsRobotBusy } from '../hooks'
import { handleUpdateBuildroot } from '../RobotSettings/UpdateBuildroot'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'

import type { State } from '../../../redux/types'

vi.mock('../../../redux/robot-controls')
vi.mock('../../../redux/robot-admin')
vi.mock('../hooks')
vi.mock('../../../redux/robot-update')
vi.mock('../../../resources/networking/hooks')
vi.mock(
  '../../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
)
vi.mock('../../ChooseProtocolSlideout')
vi.mock('../../ProtocolUpload/hooks')
vi.mock('../RobotSettings/UpdateBuildroot')
vi.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')

const getBuildrootUpdateDisplayInfo = Buildroot.getRobotUpdateDisplayInfo

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
  vi.useFakeTimers()

  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    when(getBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .thenReturn({
        autoUpdateAction: 'reinstall',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    vi.mocked(useIsRobotBusy).mockReturnValue(false)
    vi.mocked(handleUpdateBuildroot).mockReturnValue()
    vi.mocked(ChooseProtocolSlideout).mockReturnValue(
      <div>choose protocol slideout</div>
    )
    vi.mocked(DisconnectModal).mockReturnValue(<div>mock disconnect modal</div>)
    when(useCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .thenReturn(true)
    when(useIsEstopNotDisengaged)
      .calledWith(mockConnectableRobot.name)
      .thenReturn(false)
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
    when(getBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .thenReturn({
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
    expect(handleUpdateBuildroot).toHaveBeenCalled()
  })

  it('should render disabled run a protocol, restart, disconnect, and home gantry menu items when robot is busy', () => {
    vi.mocked(useIsRobotBusy).mockReturnValue(true)

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

    expect(home).toBeCalled()
  })

  it('should render disabled disconnect button in the menu when the robot cannot disconnect', () => {
    when(useCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .thenReturn(false)

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

    screen.queryByText('mock disconnect modal')
  })

  it('clicking the restart robot button should restart the robot', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    const restartBtn = screen.getByRole('button', { name: 'Restart robot' })
    fireEvent.click(restartBtn)

    expect(restartRobot).toBeCalled()
  })
  it('render overflow menu buttons without the update robot software button', () => {
    vi.mocked(getBuildrootUpdateDisplayInfo).mockReturnValue({
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

  it('should render disabled menu items except restart robot and robot settings when e-stop is pressed', () => {
    vi.mocked(getBuildrootUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(useIsEstopNotDisengaged)
      .calledWith(mockConnectableRobot.name)
      .thenReturn(true)
    render(props)
    fireEvent.click(screen.getByRole('button'))
    expect(
      screen.getByRole('button', { name: 'Run a protocol' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart robot' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Disconnect from network' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })
})
