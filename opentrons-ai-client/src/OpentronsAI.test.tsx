import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import * as auth0 from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { i18n } from './i18n'
import { Loading } from './molecules/Loading'

import { OpentronsAI } from './OpentronsAI'
import { Landing } from './pages/Landing'
import { useGetAccessToken } from './resources/hooks'

vi.mock('@auth0/auth0-react')

const mockLogout = vi.fn()

vi.mock('./pages/Landing')
vi.mock('./molecules/Loading')
vi.mock('./resources/hooks/useGetAccessToken')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OpentronsAI />, {
    i18nInstance: i18n,
  })
}

describe('OpentronsAI', () => {
  beforeEach(() => {
    vi.mocked(useGetAccessToken).mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('mock access token'),
    })
    vi.mocked(Landing).mockReturnValue(<div>mock Landing page</div>)
    vi.mocked(Loading).mockReturnValue(<div>mock Loading</div>)
  })

  it('should render loading screen when isLoading is true', () => {
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })
    render()
    screen.getByText('mock Loading')
  })

  it('should render text', () => {
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    render()
    screen.getByText('mock Landing page')
    screen.getByText('Logout')
  })

  // Add it back in when the Header and Footer components are implemented
  //   it('should render Header component', () => {
  //     ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
  //       isAuthenticated: true,
  //       isLoading: false,
  //     })
  //     render()
  //     screen.getByText('mock Header component')
  //   })

  //   it('should render Footer component', () => {
  //     ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
  //       isAuthenticated: true,
  //       isLoading: false,
  //     })
  //     render()
  //     screen.getByText('mock Footer component')
  //   })

  it('should call a mock function when clicking logout button', () => {
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
    })
    render()
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    expect(mockLogout).toHaveBeenCalled()
  })
})
