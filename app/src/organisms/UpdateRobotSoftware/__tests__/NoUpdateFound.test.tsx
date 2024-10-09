import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { NoUpdateFound } from '../NoUpdateFound'

const mockOnContinue = vi.fn()

const render = () => {
  return renderWithProviders(<NoUpdateFound onContinue={mockOnContinue} />, {
    i18nInstance: i18n,
  })
}

describe('NoUpdateFound', () => {
  it('should render text, icon and button', () => {
    render()
    screen.getByText('Your software is already up to date!')
    expect(
      screen.getByTestId('NoUpdateFound_check_circle_icon')
    ).toBeInTheDocument()
    screen.getByText('Continue')
  })

  it('should call mock function when tapping next button', () => {
    render()
    fireEvent.click(screen.getByText('Continue'))
    expect(mockOnContinue).toBeCalled()
  })
})
