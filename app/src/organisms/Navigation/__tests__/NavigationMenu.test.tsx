import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import { useLights } from '../../Devices/hooks'
import { RestartRobotConfirmationModal } from '../RestartRobotConfirmationModal'
import { useFeatureFlag } from '../../../redux/config'
import { NavigationMenu } from '../NavigationMenu'

jest.mock('../../../redux/robot-admin')
jest.mock('../../../redux/robot-controls')
jest.mock('../../Devices/hooks')
jest.mock('../../../redux/config')
jest.mock('../RestartRobotConfirmationModal')

const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockHome = home as jest.MockedFunction<typeof home>
const mockToggleLights = jest.fn()

const mockRestartRobotConfirmationModal = RestartRobotConfirmationModal as jest.MockedFunction<
  typeof RestartRobotConfirmationModal
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
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
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render the home menu item and clicking home gantry, dispatches home and call a mock function', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('BackgroundOverlay_ModalShell').click()
    expect(props.onClick).toHaveBeenCalled()
    getByLabelText('home-gantry_icon')
    getByText('Home gantry').click()
    expect(mockHome).toHaveBeenCalled()
    expect(props.setShowNavMenu).toHaveBeenCalled()
  })

  it('should render the restart robot menu item and clicking it, dispatches restart robot', () => {
    const { getByText, getByLabelText } = render(props)
    const restart = getByText('Restart robot')
    getByLabelText('restart_icon')
    restart.click()
    getByText('mock RestartRobotConfirmationModal')
  })

  it('should render the lights menu item with lights off and clicking it, calls useLights', () => {
    const { getByText, getByLabelText } = render(props)
    const lights = getByText('Lights on')
    getByLabelText('light_icon')
    lights.click()
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

  // ToDo (kk:09/29/2023) menu item clicking test will be added
  it('should render the deck configuration menu item when enableDeckConfiguration is on', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(true)
    const { getByText, getByLabelText } = render(props)
    getByText('Deck configuration')
    getByLabelText('deck-map_icon')
  })
})
