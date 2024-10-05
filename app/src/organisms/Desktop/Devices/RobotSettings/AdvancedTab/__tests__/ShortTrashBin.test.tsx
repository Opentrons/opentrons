import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getRobotSettings } from '/app/redux/robot-settings'

import { ShortTrashBin } from '../ShortTrashBin'

vi.mock('/app/redux/robot-settings/selectors')

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
      <ShortTrashBin settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings ShortTrashBin', () => {
  beforeEach(() => {
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
  })

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
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    vi.mocked(getRobotSettings).mockReturnValue([tempMockSettings])
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
