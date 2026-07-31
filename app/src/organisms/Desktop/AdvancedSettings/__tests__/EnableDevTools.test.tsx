import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import {
  clearDevInternalFlags,
  getDevtoolsEnabled,
  toggleDevtools,
} from '/app/redux/config'

import { EnableDevTools } from '../EnableDevTools'

import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    usePostLogMessageMutation: vi.fn(),
  }
})
vi.mock('/app/local-resources/access-control/useDocumentationState')
vi.mock('/app/redux/config')

const mockPostLogMessage = vi.fn()

const render = () => {
  return renderWithProviders(<EnableDevTools />, {
    i18nInstance: i18n,
  })
}

describe('EnableDevTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDevtoolsEnabled).mockReturnValue(true)
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
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
