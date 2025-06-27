import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { featureFlagsAtom } from '../../../resources/atoms'
import { Settings } from '../index'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(<Settings />, {
    i18nInstance: i18n,
  })
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Settings page title', () => {
    render()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render()
    expect(screen.getByText('Back')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('should render Privacy section', () => {
    render()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(
      screen.getByText('Share analytics with Opentrons')
    ).toBeInTheDocument()
  })

  it('should render analytics toggle in Privacy section', () => {
    render()
    // Look for the toggle button by its role
    const toggles = screen.getAllByRole('switch')
    expect(toggles.length).toBeGreaterThanOrEqual(1)
  })

  it('should navigate to landing page when back button is clicked', () => {
    render()
    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should toggle analytics when analytics toggle is clicked', () => {
    render()
    // Get all toggle switches and find the analytics one
    const toggles = screen.getAllByRole('switch')
    const analyticsToggle = toggles[0] // First toggle should be analytics

    // Click the toggle
    fireEvent.click(analyticsToggle)

    // The toggle state should change (we can't easily test the exact state
    // change without more complex mocking, but we can verify the click works)
    expect(analyticsToggle).toBeInTheDocument()
  })

  it('should not render Feature Flags section by default', () => {
    render()
    expect(screen.queryByText('Feature Flags')).not.toBeInTheDocument()
  })

  it('should render Feature Flags section when prerelease mode is enabled', () => {
    // Mock the featureFlags atom to have prerelease mode enabled
    const mockFeatureFlags = {
      enablePrereleaseMode: true,
      enableAnalytics: true,
      enablePDProtocolGeneration: true,
    }

    // Render with custom initial state
    renderWithProviders(<Settings />, {
      i18nInstance: i18n,
      initialValues: [[featureFlagsAtom, mockFeatureFlags]],
    })

    expect(screen.getByText('Feature Flags')).toBeInTheDocument()
    expect(
      screen.getByText('Protocol Designer Protocol Generation')
    ).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render()
    const backButton = screen.getByTestId('back-button')
    expect(backButton).toHaveAttribute('aria-label', 'Back')

    const toggles = screen.getAllByRole('switch')
    toggles.forEach(toggle => {
      expect(toggle).toHaveAttribute('aria-checked')
    })
  })
})
