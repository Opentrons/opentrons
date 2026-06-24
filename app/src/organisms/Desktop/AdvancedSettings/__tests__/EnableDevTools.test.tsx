import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  clearDevInternalFlags,
  getDevtoolsEnabled,
  toggleDevtools,
} from '/app/redux/config'

import { EnableDevTools } from '../EnableDevTools'

vi.mock('/app/redux/config')

const render = () => {
  return renderWithProviders(<EnableDevTools />, {
    i18nInstance: i18n,
  })
}

describe('EnableDevTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should call toggleDevtools and clearDevInternalFlags when clicking the toggle button while dev tools are on', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'enable_dev_tools',
    })
    fireEvent.click(toggleButton)
    expect(vi.mocked(clearDevInternalFlags)).toHaveBeenCalled()
    expect(vi.mocked(toggleDevtools)).toHaveBeenCalled()
  })

  it('should call toggleDevtools but not clearDevInternalFlags when clicking the toggle button while dev tools are off', () => {
    vi.mocked(getDevtoolsEnabled).mockReturnValue(false)
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'enable_dev_tools',
    })
    fireEvent.click(toggleButton)
    expect(vi.mocked(clearDevInternalFlags)).not.toHaveBeenCalled()
    expect(vi.mocked(toggleDevtools)).toHaveBeenCalled()
  })
})
