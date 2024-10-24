import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import type { NavigateFunction } from 'react-router-dom'

import { Landing } from '../index'
import { i18n } from '../../../i18n'

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

  it('should render create and update protocol buttons', () => {
    render()
    expect(screen.getByText('Create a new protocol')).toBeInTheDocument()
    expect(screen.getByText('Update an existing protocol')).toBeInTheDocument()
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
    createProtocolButton.click()
    expect(mockNavigate).toHaveBeenCalledWith('/new-protocol')
  })

  it('should redirect to the update protocol page when the update an existing protocol button is clicked', () => {
    render()
    const updateProtocolButton = screen.getByText('Update an existing protocol')
    updateProtocolButton.click()
    expect(mockNavigate).toHaveBeenCalledWith('/update-protocol')
  })

  it('should track new protocol event when new protocol button is clicked', () => {
    render()
    const createProtocolButton = screen.getByText('Create a new protocol')
    createProtocolButton.click()

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'create-new-protocol',
      properties: {},
    })
  })

  it('should track logout event when log out button is clicked', () => {
    render()
    const updateProtocolButton = screen.getByText('Update an existing protocol')
    updateProtocolButton.click()

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'update-protocol',
      properties: {},
    })
  })
})
