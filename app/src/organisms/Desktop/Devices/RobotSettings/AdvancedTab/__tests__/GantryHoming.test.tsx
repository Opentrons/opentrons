import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { GantryHoming } from '../GantryHoming'

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
vi.mock('@opentrons/react-api-client', () => ({
  useUpdateRobotSettingMutation: () => ({
    updateRobotSetting: vi.fn(),
  }),
}))

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
      <GantryHoming settings={mockSettings} isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisableHoming', () => {
  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Home Gantry on Restart')
    screen.getByText('Homes the gantry along the z-axis.')
    const toggleButton = screen.getByRole('switch', { name: 'gantry_homing' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should change the value when a user clicks a toggle button', () => {
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
