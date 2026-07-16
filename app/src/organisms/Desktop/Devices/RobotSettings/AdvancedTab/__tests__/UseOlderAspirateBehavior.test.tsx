import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { UseOlderAspirateBehavior } from '../UseOlderAspirateBehavior'

const mockSettings = {
  id: 'useOldAspirationFunctions',
  title: 'Use older aspirate behavior',
  description:
    'Aspirate with the less accurate volumetric calibrations that were used before version 3.7.0. Use this if you need consistency with pre-v3.7.0 results. This only affects GEN1 P10S, P10M, P50S, P50M, and P300S pipettes.',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <UseOlderAspirateBehavior
        settings={mockSettings}
        robotName="otie"
        isRobotBusy
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UseOlderAspirateBehavior', () => {
  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Use older aspirate behavior')
    screen.getByText(
      'Aspirate with the less accurate volumetric calibrations that were used before version 3.7.0. Use this if you need consistency with pre-v3.7.0 results. This only affects GEN1 P10S, P10M, P50M, and P300S pipettes.'
    )
    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_aspirate_behavior',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_aspirate_behavior',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_aspirate_behavior',
    })
    expect(toggleButton).toBeDisabled()
  })
})
