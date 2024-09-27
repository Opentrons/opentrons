import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { i18n } from '/app/i18n'
import { renderWithProviders } from '/app/__testing-utils__'
import { getDevtoolsEnabled, toggleDevtools } from '/app/redux/config'
import { EnableDevTools } from '../EnableDevTools'

vi.mock('/app/redux/config')

const render = () => {
  return renderWithProviders(<EnableDevTools />, {
    i18nInstance: i18n,
  })
}

describe('EnableDevTools', () => {
  beforeEach(() => {
    vi.mocked(getDevtoolsEnabled).mockReturnValue(true)
  })

  it('should render text and toggle button', () => {
    render()
    screen.getByText('Developer Tools')
    screen.getByText(
      'Enabling this setting opens Developer Tools on app launch, enables additional logging and gives access to feature flags.'
    )
    screen.getByRole('switch', { name: 'enable_dev_tools' })
  })

  it('should call mock toggleConfigValue when clicking the toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'enable_dev_tools',
    })
    fireEvent.click(toggleButton)
    expect(vi.mocked(toggleDevtools)).toHaveBeenCalled()
  })
})
