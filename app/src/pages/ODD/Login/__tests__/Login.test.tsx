import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Login } from '..'

vi.mock('/app/atoms/SoftwareKeyboard', () => ({
  FullKeyboard: () => <div data-testid="mock-full-keyboard">keyboard</div>,
}))

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('Login', () => {
  it('renders navigation, username field, and action buttons', () => {
    render()
    expect(screen.getAllByText('Login').length).toBeGreaterThanOrEqual(1)
    screen.getByText('Username')
    screen.getByText('next')
    screen.getByText('cancel')
    screen.getByRole('textbox')
  })

  it('shows the software keyboard when the username field is focused', () => {
    render()
    expect(screen.queryByTestId('mock-full-keyboard')).not.toBeInTheDocument()
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByTestId('mock-full-keyboard')).toBeInTheDocument()
  })
})
