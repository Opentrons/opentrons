import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ShortTrashBin } from '../ShortTrashBin'

const mockSettings = {
  id: 'shortFixedTrash',
  title: 'Short (55mm) fixed trash',
  description: 'Trash box is 55mm tall (rather than the 77mm default)',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <ShortTrashBin settings={mockSettings} isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings ShortTrashBin', () => {
  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Short trash bin')
    screen.getByText(
      'For pre-2019 robots with trash bins that are 55mm tall (instead of 77mm default)'
    )
    const toggleButton = screen.getByRole('switch', { name: 'short_trash_bin' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'short_trash_bin',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'short_trash_bin',
    })
    expect(toggleButton).toBeDisabled()
  })
})
