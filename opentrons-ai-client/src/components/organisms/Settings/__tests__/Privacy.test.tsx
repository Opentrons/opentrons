import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { Privacy } from '../Privacy'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof Privacy>) => {
  return renderWithProviders(<Privacy {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Privacy', () => {
  let props: ComponentProps<typeof Privacy>

  beforeEach(() => {
    props = {
      enableAnalytics: true,
      onToggleAnalytics: vi.fn(),
    }
  })

  it('renders the privacy section', () => {
    render(props)
    screen.getByText('Privacy')
    screen.getByText('Share analytics with Opentrons')
    screen.getByText(
      'Help Opentrons improve its products and services by automatically sending anonymous diagnostics and usage data'
    )
    screen.getByRole('switch')
  })

  it('should call onToggleAnalytics when clicking toggle switch when analytics is enabled', () => {
    render(props)
    fireEvent.click(screen.getByRole('switch'))
    expect(props.onToggleAnalytics).toHaveBeenCalled()
  })

  it('should call onToggleAnalytics when clicking toggle switch when analytics is disabled', () => {
    props.enableAnalytics = false
    render(props)
    fireEvent.click(screen.getByRole('switch'))
    expect(props.onToggleAnalytics).toHaveBeenCalled()
  })
})
