import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { Landing } from '../index'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockUseTrackEvent = vi.fn()

vi.mock('/ai-client/resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('/ai-client/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

const render = () => {
  return renderWithProviders(<Landing />, {
    i18nInstance: i18n,
  })
}

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render', () => {
    render()
    expect(screen.getByText('Welcome to OpentronsAI')).toBeInTheDocument()
  })

  it('should render the image, heading and body text', () => {
    render()
    expect(screen.getByAltText('welcome image')).toBeInTheDocument()
    expect(screen.getByText('Welcome to OpentronsAI')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Get started creating and optimizing protocols for your Opentrons robot.'
      )
    ).toBeInTheDocument()
  })

  it('should render three action cards with titles, descriptions and links', () => {
    render()
    // Update card
    expect(screen.getByText('Update an existing protocol')).toBeInTheDocument()
    expect(
      screen.getByText(
        "Upload your existing protocol and explain what you'd like to change."
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Update a protocol')).toBeInTheDocument()

    // Create card
    expect(screen.getByText('Help with a new protocol')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Go through our wizard to create a new protocol from scratch'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Create a new protocol')).toBeInTheDocument()

    // Chat card
    expect(screen.getByText('Go to chat')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Head directly to OpentronsAI chat to ask a question or paste an existing prompt.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Chat now')).toBeInTheDocument()
  })

  it('should render the chat card with title and link', () => {
    render()
    expect(screen.getByText('Go to chat')).toBeInTheDocument()
    expect(screen.getByText('Chat now')).toBeInTheDocument()
  })

  it('should render the mobile body text if the screen width is less than 768px', () => {
    vi.stubGlobal('innerWidth', 767)
    window.dispatchEvent(new Event('resize'))
    render()
    expect(
      screen.getByText('Use a desktop browser to use OpentronsAI.')
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('should redirect to the new protocol page when the create a new protocol button is clicked', () => {
    render()
    const createProtocolButton = screen.getByText('Create a new protocol')
    fireEvent.click(createProtocolButton)
    expect(mockNavigate).toHaveBeenCalledWith('/new-protocol')
  })

  it('should redirect to the update protocol page when the update a protocol link is clicked', () => {
    render()
    const updateProtocolLink = screen.getByText('Update a protocol')
    fireEvent.click(updateProtocolLink)
    expect(mockNavigate).toHaveBeenCalledWith('/update-protocol')
  })

  it('should redirect to the chat page when the chat now link is clicked', () => {
    render()
    const chatLink = screen.getByText('Chat now')
    fireEvent.click(chatLink)
    expect(mockNavigate).toHaveBeenCalledWith('/chat')
  })

  it('should track new protocol event when new protocol button is clicked', () => {
    render()
    const createProtocolButton = screen.getByText('Create a new protocol')
    fireEvent.click(createProtocolButton)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'create-new-protocol',
      properties: {},
    })
  })

  it('should track update protocol event when update a protocol link is clicked', () => {
    render()
    const updateProtocolLink = screen.getByText('Update a protocol')
    fireEvent.click(updateProtocolLink)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'update-protocol',
      properties: {},
    })
  })

  it('should track go-to-chat event when chat now link is clicked', () => {
    render()
    const chatLink = screen.getByText('Chat now')
    fireEvent.click(chatLink)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'go-to-chat',
      properties: {},
    })
  })
})
