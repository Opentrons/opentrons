import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useHomeGantry } from '/app/local-resources/instruments'
import { ChooseProtocolSlideout } from '/app/organisms/Desktop/ChooseProtocolSlideout'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsRobotBusy } from '/app/redux-resources/robots'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useRestartRobotMutation } from '/app/resources/devices/hooks/useRestartRobotMutation'
import { useCanDisconnect } from '/app/resources/networking/hooks'
import { useCurrentRunId } from '/app/resources/runs'

import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'
import { DisconnectModal } from '../RobotSettings/ConnectNetwork/DisconnectModal'
import { handleUpdateBuildroot } from '../RobotSettings/UpdateBuildroot'

import type { ComponentProps } from 'react'

vi.mock('/app/local-resources/instruments')
vi.mock('/app/organisms/ToasterOven')
vi.mock('../hooks')
vi.mock('/app/redux/robot-update')
vi.mock('/app/resources/networking/hooks')
vi.mock('../RobotSettings/ConnectNetwork/DisconnectModal')
vi.mock('/app/organisms/Desktop/ChooseProtocolSlideout')
vi.mock('/app/resources/runs')
vi.mock('../RobotSettings/UpdateBuildroot')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')
vi.mock('/app/resources/devices/hooks/useRestartRobotMutation')
vi.mock('/app/resources/devices/hooks/useFullShutdownMutation', () => ({
  useFullShutdownMutation: () => ({ mutate: vi.fn() }),
}))
vi.mock('/app/redux-resources/robots')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockRestart = vi.fn()

const render = (props: ComponentProps<typeof RobotOverviewOverflowMenu>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverviewOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const mockHomeGantry = vi.fn()
const mockMakeSnackbar = vi.fn()
let capturedHomeGantryProps: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}

describe('RobotOverviewOverflowMenu', () => {
  let props: ComponentProps<typeof RobotOverviewOverflowMenu>
  vi.useFakeTimers()

  beforeEach(() => {
    mockHomeGantry.mockResolvedValue(undefined)
    mockRestart.mockReset()
    capturedHomeGantryProps = {}
    vi.mocked(useHomeGantry).mockImplementation((props: any) => {
      capturedHomeGantryProps = props
      return {
        homeGantry: mockHomeGantry,
        isHoming: false,
      } as any
    })
    vi.mocked(useRestartRobotMutation).mockReturnValue({
      restart: mockRestart,
    } as any)
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
    } as any)
    props = { robot: mockConnectableRobot }
    vi.mocked(useIsRobotOnWrongVersionOfSoftware).mockReturnValue(false)
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
    vi.mocked(useIsRobotOnWrongVersionOfSoftware).mockReturnValue(true)

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

    expect(mockHomeGantry).toHaveBeenCalled()
  })

  it('clicking home gantry should show a close-door snackbar when homing fails because the door is open', () => {
    const doorOpenError = {
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: {
        status: 409,
        data: {
          errors: [{ id: 'MaintenanceCommandDoorOpen' }],
        },
      },
    }
    render(props)

    fireEvent.click(screen.getByRole('button'))

    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    expect(mockHomeGantry).toHaveBeenCalled()
    expect(capturedHomeGantryProps.onError).toEqual(expect.any(Function))
    capturedHomeGantryProps.onError?.(doorOpenError as any)
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Close the robot door to home gantry'
    )
  })

  it('clicking home gantry should not show a snackbar when homing fails for a non-door reason', () => {
    mockMakeSnackbar.mockClear()
    render(props)

    fireEvent.click(screen.getByRole('button'))

    const homeBtn = screen.getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    capturedHomeGantryProps.onError?.(new Error('boom'))
    expect(mockMakeSnackbar).not.toHaveBeenCalled()
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

    expect(mockRestart).toBeCalled()
  })
  it('render overflow menu buttons without the update robot software button', () => {
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
