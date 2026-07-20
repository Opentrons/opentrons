import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { LegacySettings } from '../LegacySettings'

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
      <LegacySettings settings={mockSettings} isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings LegacySettings', () => {
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
