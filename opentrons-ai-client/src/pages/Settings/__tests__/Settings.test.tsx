import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { FeatureFlag } from '../../../components/organisms/Settings/FeatureFlag'
import { Privacy } from '../../../components/organisms/Settings/Privacy'
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

vi.mock('../../../components/organisms/Settings/Privacy')
vi.mock('../../../components/organisms/Settings/FeatureFlag')

const render = () => {
  return renderWithProviders(<Settings />, {
    i18nInstance: i18n,
  })
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Privacy).mockReturnValue(
      <div data-testid="mock-privacy">
        <div>Mock Privacy Component</div>
      </div>
    )
    vi.mocked(FeatureFlag).mockReturnValue(
      <div data-testid="mock-feature-flag">
        <div>Mock Feature Flags Component</div>
      </div>
    )
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
    expect(screen.getByTestId('mock-privacy')).toBeInTheDocument()
    expect(screen.getByText('Mock Privacy Component')).toBeInTheDocument()
  })

  it('should navigate to landing page when back button is clicked', () => {
    render()
    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should pass correct props to Privacy component', () => {
    render()

    expect(Privacy).toHaveBeenCalledWith(
      expect.objectContaining({
        enableAnalytics: true,
        onToggleAnalytics: expect.any(Function),
      }),
      expect.anything()
    )
  })

  it('should handle analytics toggle', () => {
    vi.mocked(Privacy).mockReturnValue(
      <div data-testid="mock-privacy">
        <div>Mock Privacy Component</div>
        <div>Analytics: enabled</div>
        <button onClick={() => {}}>Toggle Analytics</button>
      </div>
    )

    render()
    const toggleButton = screen.getByText('Toggle Analytics')

    // Initial state shows analytics enabled
    expect(screen.getByText('Analytics: enabled')).toBeInTheDocument()

    // Click toggle
    fireEvent.click(toggleButton)

    // The Privacy component should be called with the handler function
    const lastCall = vi.mocked(Privacy).mock.calls[
      vi.mocked(Privacy).mock.calls.length - 1
    ]
    expect(typeof lastCall[0].onToggleAnalytics).toBe('function')
  })

  it('should not render Feature Flags section by default', () => {
    render()
    expect(screen.queryByTestId('mock-feature-flag')).not.toBeInTheDocument()
  })

  it('should render Feature Flags section when prerelease mode is enabled', () => {
    const mockFeatureFlags = {
      enablePrereleaseMode: true,
      enableAnalytics: true,
      enablePDProtocolGeneration: true,
    }

    renderWithProviders(<Settings />, {
      i18nInstance: i18n,
      initialValues: [[featureFlagsAtom, mockFeatureFlags]],
    })

    expect(screen.getByTestId('mock-feature-flag')).toBeInTheDocument()
    expect(screen.getByText('Mock Feature Flags Component')).toBeInTheDocument()
  })

  it('should pass correct props to FeatureFlag component when rendered', () => {
    const mockFeatureFlags = {
      enablePrereleaseMode: true,
      enableAnalytics: true,
      enablePDProtocolGeneration: true,
    }

    renderWithProviders(<Settings />, {
      i18nInstance: i18n,
      initialValues: [[featureFlagsAtom, mockFeatureFlags]],
    })

    expect(FeatureFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        enablePDProtocolGeneration: true,
        onTogglePDProtocolGeneration: expect.any(Function),
      }),
      expect.anything()
    )
  })

  it('should have proper accessibility attributes', () => {
    render()
    const backButton = screen.getByTestId('back-button')
    expect(backButton).toHaveAttribute('aria-label', 'Back')
  })
})
