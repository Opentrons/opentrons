import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { Header } from '../index'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import * as auth0 from '@auth0/auth0-react'

vi.mock('@auth0/auth0-react')
const mockLogout = vi.fn()
const mockUseTrackEvent = vi.fn()

vi.mock('../../../resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<Header />, {
    i18nInstance: i18n,
  })
}

describe('Header', () => {
  beforeEach(() => {
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
    })
  })

  it('should render Header component', () => {
    render()
    screen.getByText('Opentrons')
  })

  it('should render log out button', () => {
    render()
    screen.getByText('Logout')
  })

  it('should logout when log out button is clicked', () => {
    render()
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    expect(mockLogout).toHaveBeenCalled()
  })

  it('should track logout event when log out button is clicked', () => {
    render()
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'user-logout',
      properties: {},
    })
  })
})
