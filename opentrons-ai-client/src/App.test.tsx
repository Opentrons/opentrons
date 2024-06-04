import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import * as auth0 from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { i18n } from './i18n'
import { SidePanel } from './molecules/SidePanel'
import { MainContentContainer } from './organisms/MainContentContainer'
import { Loading } from './molecules/Loading'

import { App } from './App'

vi.mock('@auth0/auth0-react')

const mockLogout = vi.fn()

vi.mock('./molecules/SidePanel')
vi.mock('./organisms/MainContentContainer')
vi.mock('./molecules/Loading')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />, {
    i18nInstance: i18n,
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(SidePanel).mockReturnValue(<div>mock SidePanel</div>)
    vi.mocked(MainContentContainer).mockReturnValue(
      <div>mock MainContentContainer</div>
    )
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
    screen.getByText('mock SidePanel')
    screen.getByText('mock MainContentContainer')
    screen.getByText('Logout')
  })

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
