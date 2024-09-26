import { MemoryRouter } from 'react-router-dom'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getRobotSettings } from '/app/redux/robot-settings'

import { UsageSettings } from '../UsageSettings'

vi.mock('/app/redux/robot-settings/selectors')

const mockSettings = {
  id: 'enableDoorSafetySwitch',
  title: 'Enable robot door safety switch',
  description:
    'Automatically pause protocols when robot door opens. Opening the robot door during a run will pause your robot only after it has completed its current motion.',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <UsageSettings settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings GantryHoming', () => {
  beforeEach(() => {
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
  })

  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Usage Settings')
    screen.getByText('Pause protocol when robot door opens')
    screen.getByText(
      'When enabled, opening the robot door during a run will pause the robot after it has completed its current motion.'
    )
    const toggleButton = screen.getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    vi.mocked(getRobotSettings).mockReturnValue([tempMockSettings])
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    expect(toggleButton).toBeDisabled()
  })
})
