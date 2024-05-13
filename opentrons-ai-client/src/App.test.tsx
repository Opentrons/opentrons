import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import * as auth0 from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'
import { Loading } from './molecules/Loading'

import { App } from './App'

vi.mock('@auth0/auth0-react')

const mockLogout = vi.fn()

vi.mock('./molecules/SidePanel')
vi.mock('./organisms/ChatContainer')
vi.mock('./molecules/Loading')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />)
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(SidePanel).mockReturnValue(<div>mock SidePanel</div>)
    vi.mocked(ChatContainer).mockReturnValue(<div>mock ChatContainer</div>)
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
    screen.getByText('mock ChatContainer')
  })
})
