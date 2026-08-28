import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { updateSetting } from '/app/redux/robot-settings'

import { FrontButtonRunControls } from '../FrontButtonRunControls'

import type { ComponentProps } from 'react'

const ROBOT_NAME = 'otie'
const SETTING_ID = 'disableOT2FrontButton'
const TOGGLE_LABEL = 'front_button_run_controls'

const mockSettings = {
  id: SETTING_ID,
  title: 'Disable OT-2 front button run controls',
  description: 'Front button run controls description',
  value: false,
  restart_required: true,
}

const render = (props: ComponentProps<typeof FrontButtonRunControls>) => {
  return renderWithProviders(<FrontButtonRunControls {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FrontButtonRunControls', () => {
  let props: ComponentProps<typeof FrontButtonRunControls>

  beforeEach(() => {
    props = {
      settings: mockSettings,
      robotName: ROBOT_NAME,
      isRobotBusy: false,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render title, description and toggle button', () => {
    render(props)
    screen.getByText('Control runs with the front button')
    screen.getByText(
      'When enabled, you can press the button on the front of the OT-2 to pause or resume an ongoing run. Requires a robot restart to take effect.'
    )
    const toggleButton = screen.getByRole('switch', { name: TOGGLE_LABEL })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should show the toggle as off when the setting is disabled', () => {
    props = { ...props, settings: { ...mockSettings, value: true } }
    render(props)
    const toggleButton = screen.getByRole('switch', { name: TOGGLE_LABEL })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should dispatch disable=true when the enable toggle is turned off', () => {
    const [, store] = render(props)
    fireEvent.click(screen.getByRole('switch', { name: TOGGLE_LABEL }))
    expect(store.dispatch).toHaveBeenCalledWith(
      updateSetting(ROBOT_NAME, SETTING_ID, true)
    )
  })

  it('should dispatch disable=false when the enable toggle is turned on', () => {
    props = { ...props, settings: { ...mockSettings, value: true } }
    const [, store] = render(props)
    fireEvent.click(screen.getByRole('switch', { name: TOGGLE_LABEL }))
    expect(store.dispatch).toHaveBeenCalledWith(
      updateSetting(ROBOT_NAME, SETTING_ID, false)
    )
  })

  it('should disable the toggle button and not dispatch when the robot is busy', () => {
    props = { ...props, isRobotBusy: true }
    const [, store] = render(props)
    const toggleButton = screen.getByRole('switch', { name: TOGGLE_LABEL })
    expect(toggleButton).toBeDisabled()
    fireEvent.click(toggleButton)
    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
