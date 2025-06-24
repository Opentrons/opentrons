import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { Landing } from '../index'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockUseTrackEvent = vi.fn()

vi.mock('../../../resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../hooks/useTrackEvent', () => ({
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
        'Get started building a prompt that will generate a Python protocol that you can use on your Opentrons robot. OpentronsAI lets you create and optimize your protocol by responding in natural language.'
      )
    ).toBeInTheDocument()
  })

  it('should render create and update protocol buttons with correct text', () => {
    render()
    expect(screen.getByText('Create a new protocol')).toBeInTheDocument()
    expect(
      screen.getByText('Get help with an existing protocol')
    ).toBeInTheDocument()
  })

  it('should render the go directly to chat link', () => {
    render()
    expect(screen.getByText('Go directly to chat')).toBeInTheDocument()
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

  it('should redirect to the update protocol page when the get help with existing protocol button is clicked', () => {
    render()
    const updateProtocolButton = screen.getByText(
      'Get help with an existing protocol'
    )
    fireEvent.click(updateProtocolButton)
    expect(mockNavigate).toHaveBeenCalledWith('/update-protocol')
  })

  it('should redirect to the chat page when the go directly to chat link is clicked', () => {
    render()
    const chatLink = screen.getByText('Go directly to chat')
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

  it('should track update protocol event when get help with existing protocol button is clicked', () => {
    render()
    const updateProtocolButton = screen.getByText(
      'Get help with an existing protocol'
    )
    fireEvent.click(updateProtocolButton)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'update-protocol',
      properties: {},
    })
  })

  it('should track go-to-chat event when go directly to chat link is clicked', () => {
    render()
    const chatLink = screen.getByText('Go directly to chat')
    fireEvent.click(chatLink)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'go-to-chat',
      properties: {},
    })
  })
})
