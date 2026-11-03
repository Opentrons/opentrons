import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useHomeGantry } from '/app/local-resources/instruments'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsFlex } from '/app/redux-resources/robots'
import { useLights } from '/app/resources/devices'

import { NavigationMenu } from '../NavigationMenu'
import { RestartRobotConfirmationModal } from '../RestartRobotConfirmationModal'
import { ShutdownRobotConfirmationModal } from '../ShutdownRobotConfirmationModal'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

vi.mock('/app/local-resources/instruments')
vi.mock('/app/organisms/ToasterOven')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/robot-admin')
vi.mock('/app/resources/devices')
vi.mock('/app/redux-resources/robots')
vi.mock('../RestartRobotConfirmationModal')
vi.mock('../ShutdownRobotConfirmationModal')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockToggleLights = vi.fn()
const mockHomeGantry = vi.fn()
const mockMakeSnackbar = vi.fn()
let capturedHomeGantryProps: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}

const render = (props: ComponentProps<typeof NavigationMenu>) => {
  return renderWithProviders(<NavigationMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('NavigationMenu', () => {
  let props: ComponentProps<typeof NavigationMenu>
  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      robotName: 'otie',
      setShowNavMenu: vi.fn(),
    }
    mockHomeGantry.mockResolvedValue(undefined)
    capturedHomeGantryProps = {}
    vi.mocked(useLights).mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
    vi.mocked(useHomeGantry).mockImplementation((props: any) => {
      capturedHomeGantryProps = props
      return {
        homeGantry: mockHomeGantry,
        isHoming: false,
      } as any
    })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
    } as any)
    vi.mocked(useIsFlex).mockReturnValue(true)
    vi.mocked(RestartRobotConfirmationModal).mockReturnValue(
      <div>mock RestartRobotConfirmationModal</div>
    )
    vi.mocked(ShutdownRobotConfirmationModal).mockReturnValue(
      <div>mock ShutdownRobotConfirmationModal</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render the home menu item and clicking home gantry, homes the robot and call a mock function', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay_ModalShell'))
    expect(props.onClick).toHaveBeenCalled()
    screen.getByLabelText('reset-position_icon')
    fireEvent.click(screen.getByText('Home gantry'))
    expect(mockHomeGantry).toHaveBeenCalled()
    expect(props.setShowNavMenu).not.toHaveBeenCalled()
    capturedHomeGantryProps.onSuccess?.()
    expect(props.setShowNavMenu).toHaveBeenCalled()
  })

  it('should disable the home menu item and show a spinner while homing', () => {
    vi.mocked(useHomeGantry).mockReturnValue({
      homeGantry: mockHomeGantry,
      isHoming: true,
    })
    render(props)

    expect(screen.getByRole('button', { name: /Home gantry/ })).toBeDisabled()
    screen.getByLabelText('spinner')
    expect(
      screen.queryByLabelText('reset-position_icon')
    ).not.toBeInTheDocument()
  })

  it('should show a close-door snackbar when homing the gantry fails because the door is open', () => {
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
    fireEvent.click(screen.getByText('Home gantry'))
    expect(mockHomeGantry).toHaveBeenCalled()
    expect(capturedHomeGantryProps.onError).toEqual(expect.any(Function))
    capturedHomeGantryProps.onError?.(doorOpenError as any)
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Close the robot door to home gantry'
    )
    expect(props.setShowNavMenu).toHaveBeenCalled()
  })

  it('should not show a snackbar when homing fails for a non-door reason', () => {
    render(props)
    fireEvent.click(screen.getByText('Home gantry'))
    capturedHomeGantryProps.onError?.(new Error('boom'))
    expect(mockMakeSnackbar).not.toHaveBeenCalled()
  })

  it('should render the restart robot menu item and clicking it, dispatches restart robot', () => {
    render(props)
    const restart = screen.getByText('Restart robot')
    screen.getByLabelText('restart_icon')
    fireEvent.click(restart)
    screen.getByText('mock RestartRobotConfirmationModal')
  })

  it('should render the turn off robot menu item and clicking it, dispatches turn off robot', () => {
    render(props)
    const turnOff = screen.getByText('Turn off robot')
    screen.getByLabelText('power-off_icon')
    fireEvent.click(turnOff)
    screen.getByText('mock ShutdownRobotConfirmationModal')
  })

  it('should render the lights menu item with lights off and clicking it, calls useLights', () => {
    render(props)
    const lights = screen.getByText('Lights on')
    screen.getByLabelText('light_icon')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render the lights menu item with lights on', () => {
    vi.mocked(useLights).mockReturnValue({
      lightsOn: true,
      toggleLights: mockToggleLights,
    })
    render(props)
    screen.getByText('Lights off')
  })

  it('should render the deck configuration menu item', () => {
    render(props)
    screen.getByText('Deck configuration')
    screen.getByLabelText('deck-map_icon')
  })

  it('should call a mock function when tapping deck configuration', () => {
    render(props)
    fireEvent.click(screen.getByText('Deck configuration'))
    expect(mockNavigate).toHaveBeenCalledWith('/deck-configuration')
  })
})
