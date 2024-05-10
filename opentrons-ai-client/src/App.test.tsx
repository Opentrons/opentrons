import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { useAuth0 } from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'

import { App } from './App'

vi.mock('@auth0/auth0-react')
vi.mock('./molecules/SidePanel')
vi.mock('./organisms/ChatContainer')

const mockLogout = vi.fn()

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />)
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    })
    vi.mocked(SidePanel).mockReturnValue(<div>mock SidePanel</div>)
    vi.mocked(ChatContainer).mockReturnValue(<div>mock ChatContainer</div>)
  })

  it('should render text', () => {
    render()
    screen.getByText('mock SidePanel')
    screen.getByText('mock ChatContainer')
  })
})
