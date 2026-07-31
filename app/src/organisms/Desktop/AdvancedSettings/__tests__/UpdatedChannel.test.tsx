import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getUpdateChannel, getUpdateChannelOptions } from '/app/redux/config'

import { UpdatedChannel } from '../UpdatedChannel'

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
  return renderWithProviders(<UpdatedChannel />, { i18nInstance: i18n })
}

describe('UpdatedChannel', () => {
  beforeEach(() => {
    vi.mocked(getUpdateChannelOptions).mockReturnValue([
      {
        label: 'Stable',
        value: 'latest',
      },
      { label: 'Beta', value: 'beta' },
      { label: 'Alpha', value: 'alpha' },
    ])
    vi.mocked(getUpdateChannel).mockReturnValue('beta')
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
  })
  it('renders text and selector', () => {
    render()
    screen.getByText('Update Channel')
    screen.getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    screen.getByRole('combobox', { name: '' })
    screen.getByText('beta')
  })
})
