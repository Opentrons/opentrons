import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { useAuth0 } from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'
import { Loading } from './molecules/Loading'

import { App } from './App'

vi.mock('@auth0/auth0-react')
const mockedUseAuth0 = vi.mocked(useAuth0, true)

const mockLogout = vi.fn()

vi.mock('./molecules/SidePanel')
vi.mock('./organisms/ChatContainer')
vi.mock('./molecules/Loading')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />)
}

describe('App', () => {
  beforeEach(() => {
    // ToDo (kk:05/13/2024) remove type any later
    mockedUseAuth0.mockReturnValue({
      isAuthenticated: true,
      user: {},
      logout: mockLogout,
      isLoading: false,
    } as any)
    vi.mocked(SidePanel).mockReturnValue(<div>mock SidePanel</div>)
    vi.mocked(ChatContainer).mockReturnValue(<div>mock ChatContainer</div>)
    vi.mocked(Loading).mockReturnValue(<div>mock Loading</div>)
  })

  it('should render loading screen when isLoading is true', () => {
    mockedUseAuth0.mockReturnValue({
      isAuthenticated: false,
      user: {},
      logout: mockLogout,
      isLoading: true,
    } as any)
    render()
    screen.getByText('mock Loading')
  })

  it('should render text', () => {
    render()

    screen.getByText('mock SidePanel')
    screen.getByText('mock ChatContainer')
  })
})
