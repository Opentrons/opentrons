import { MemoryRouter } from 'react-router-dom'
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
  return renderWithProviders(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the settings page', () => {
    render()
    screen.getByText('Settings')
    screen.getByText('Back')
    screen.getByText('Privacy')
    screen.getByText('Share analytics with Opentrons')
    screen.getByText(
      'Help Opentrons improve its products and services by automatically sending anonymous diagnostics and usage data'
    )
    screen.getByRole('switch')
  })

  it('should navigate to landing page when back button is clicked', () => {
    render()
    fireEvent.click(screen.getByText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should render Feature Flags section when prerelease mode is enabled', () => {
    const mockFeatureFlags = {
      enablePrereleaseMode: true,
      enableAnalytics: true,
      enablePDProtocolGeneration: true,
    }

    renderWithProviders(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
      {
        i18nInstance: i18n,
        initialValues: [[featureFlagsAtom, mockFeatureFlags]],
      }
    )

    screen.getByText('Feature Flags')
    screen.getByText('Protocol Designer Protocol Generation')
    screen.getByText('Enable Protocol Designer protocol generation features')
    screen.getAllByRole('switch') // Should have 2 switches now
  })
})
