import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getRobotSettings } from '/app/redux/robot-settings'

import { LegacySettings } from '../LegacySettings'

vi.mock('/app/redux/robot-settings/selectors')

const mockSettings = {
  id: 'deckCalibrationDots',
  title: 'Deck calibration to dots',
  description:
    'Perform deck calibration to dots rather than crosses, for robots that do not have crosses etched on the deck',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <LegacySettings settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings LegacySettings', () => {
  beforeEach(() => {
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
  })

  it('should render title, description, and toggle button', () => {
    render()
    screen.getByText('Legacy Settings')
    screen.getByText('Calibrate deck to dots')
    screen.getByText(
      'For pre-2019 robots that do not have crosses etched on the deck.'
    )
    const toggleButton = screen.getByRole('switch', { name: 'legacy_settings' })
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
      name: 'legacy_settings',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'legacy_settings',
    })
    expect(toggleButton).toBeDisabled()
  })
})
