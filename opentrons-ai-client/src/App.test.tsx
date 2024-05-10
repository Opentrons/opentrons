import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { useAuth0 } from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'
import { Loading } from './molecules/Loading'

import { App } from './App'

vi.mock('@auth0/auth0-react', async importOriginal => {
  const actualComponents = await importOriginal<typeof useAuth0>()
  return {
    ...actualComponents,
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }
})

vi.mock('./molecules/SidePanel')
vi.mock('./organisms/ChatContainer')
vi.mock('./molecules/Loading')

// const mockLogout = vi.fn()
// const mockUser = {}

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
    render()
    screen.getByText('mock Loading')
  })

  it('should render text', () => {
    render()

    screen.getByText('mock SidePanel')
    screen.getByText('mock ChatContainer')
  })
})
