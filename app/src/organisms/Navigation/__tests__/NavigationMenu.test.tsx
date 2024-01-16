import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import { useLights } from '../../Devices/hooks'
import { RestartRobotConfirmationModal } from '../RestartRobotConfirmationModal'
import { NavigationMenu } from '../NavigationMenu'

jest.mock('../../../redux/robot-admin')
jest.mock('../../../redux/robot-controls')
jest.mock('../../Devices/hooks')
jest.mock('../RestartRobotConfirmationModal')

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockHome = home as jest.MockedFunction<typeof home>
const mockToggleLights = jest.fn()

const mockRestartRobotConfirmationModal = RestartRobotConfirmationModal as jest.MockedFunction<
  typeof RestartRobotConfirmationModal
>

const render = (props: React.ComponentProps<typeof NavigationMenu>) => {
  return renderWithProviders(<NavigationMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('NavigationMenu', () => {
  let props: React.ComponentProps<typeof NavigationMenu>
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      robotName: 'otie',
      setShowNavMenu: jest.fn(),
    }
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
    mockRestartRobotConfirmationModal.mockReturnValue(
      <div>mock RestartRobotConfirmationModal</div>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render the home menu item and clicking home gantry, dispatches home and call a mock function', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay_ModalShell'))
    expect(props.onClick).toHaveBeenCalled()
    screen.getByLabelText('reset-position_icon')
    fireEvent.click(screen.getByText('Home gantry'))
    expect(mockHome).toHaveBeenCalled()
    expect(props.setShowNavMenu).toHaveBeenCalled()
  })

  it('should render the restart robot menu item and clicking it, dispatches restart robot', () => {
    render(props)
    const restart = screen.getByText('Restart robot')
    screen.getByLabelText('restart_icon')
    fireEvent.click(restart)
    screen.getByText('mock RestartRobotConfirmationModal')
  })

  it('should render the lights menu item with lights off and clicking it, calls useLights', () => {
    render(props)
    const lights = screen.getByText('Lights on')
    screen.getByLabelText('light_icon')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render the lights menu item with lights on', () => {
    mockUseLights.mockReturnValue({
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
    expect(mockPush).toHaveBeenCalledWith('/deck-configuration')
  })
})
