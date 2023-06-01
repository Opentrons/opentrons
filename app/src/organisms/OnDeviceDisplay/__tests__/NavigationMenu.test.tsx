import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { restartRobot } from '../../../redux/robot-admin'
import { home } from '../../../redux/robot-controls'
import { useLights } from '../../Devices/hooks'
import { NavigationMenu } from '../Navigation/NavigationMenu'

jest.mock('../../../redux/robot-admin')
jest.mock('../../../redux/robot-controls')
jest.mock('../../Devices/hooks')

const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockHome = home as jest.MockedFunction<typeof home>
const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>
const mockToggleLights = jest.fn()

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
    }
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
  })
  it('should render the home menu item and clicking home robot arm, dispatches home', () => {
    const { getByText, getByLabelText } = render(props)
    fireEvent.click(getByLabelText('BackgroundOverlay_ModalShell'))
    expect(props.onClick).toHaveBeenCalled()
    const home = getByText('Home robot arm')
    getByLabelText('home-robot-arm_icon')
    fireEvent.click(home)
    expect(mockHome).toHaveBeenCalled()
  })

  it('should render the restart robot menu item and clicking it, dispatches restart robot', () => {
    const { getByText, getByLabelText } = render(props)
    const restart = getByText('Restart robot')
    getByLabelText('restart_icon')
    fireEvent.click(restart)
    expect(mockRestartRobot).toHaveBeenCalled()
  })

  it('should render the lights menu item with lights off and clicking it, calls useLights', () => {
    const { getByText, getByLabelText } = render(props)
    const lights = getByText('Lights on')
    getByLabelText('light_icon')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render the lights menu item with lights on', () => {
    mockUseLights.mockReturnValue({
      lightsOn: true,
      toggleLights: mockToggleLights,
    })
    const { getByText } = render(props)
    getByText('Lights off')
  })
})
