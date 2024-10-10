import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'

import { DisplayRobotName } from '../DisplayRobotName'

const mockUpdateIsEXpanded = vi.fn()
const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <DisplayRobotName
        robotName="otie"
        updateIsExpanded={mockUpdateIsEXpanded}
        isRobotBusy={isRobotBusy}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisplayRobotName', () => {
  it('should render title, description, and butoon', () => {
    render()
    screen.getByText('About')
    screen.getByText('Robot Name')
    screen.getByText('otie')
    screen.getByRole('button', { name: 'Rename robot' })
  })

  it('should render a slideout when clicking the button', () => {
    render()
    const button = screen.getByRole('button', { name: 'Rename robot' })
    fireEvent.click(button)
    expect(mockUpdateIsEXpanded).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const button = screen.getByRole('button', { name: 'Rename robot' })
    expect(button).toBeDisabled()
  })
})
