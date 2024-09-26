import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'

import { DeviceReset } from '../DeviceReset'

const mockUpdateIsEXpanded = vi.fn()

vi.mock('/app/resources/runs')

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceReset
        updateIsExpanded={mockUpdateIsEXpanded}
        isRobotBusy={isRobotBusy}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceReset', () => {
  it('should render title, description, and butoon', () => {
    render()
    screen.getByText('Device Reset')
    screen.getByText(
      'Reset labware calibration, boot scripts, and/or robot calibration to factory settings.'
    )
    expect(
      screen.getByRole('button', { name: 'Choose reset settings' })
    ).toBeInTheDocument()
  })

  it('should render a slideout when clicking the button', () => {
    render()
    const button = screen.getByRole('button', {
      name: 'Choose reset settings',
    })
    fireEvent.click(button)
    expect(mockUpdateIsEXpanded).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const button = screen.getByRole('button', {
      name: 'Choose reset settings',
    })
    expect(button).toBeDisabled()
  })
})
