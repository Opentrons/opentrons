import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getRobotSettings } from '/app/redux/robot-settings'

import { GantryHoming } from '../GantryHoming'

vi.mock('/app/redux/robot-settings/selectors')
vi.mock('../../../hooks')

const mockSettings = {
  id: 'homing-test',
  title: 'Disable home on boot',
  description: 'Disable home on boot test',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <GantryHoming settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisableHoming', () => {
  beforeEach(() => {
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
  })

  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Home Gantry on Restart')
    screen.getByText('Homes the gantry along the z-axis.')
    const toggleButton = screen.getByRole('switch', { name: 'gantry_homing' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    vi.mocked(getRobotSettings).mockReturnValue([tempMockSettings])
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'gantry_homing',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'gantry_homing',
    })
    expect(toggleButton).toBeDisabled()
  })
})
