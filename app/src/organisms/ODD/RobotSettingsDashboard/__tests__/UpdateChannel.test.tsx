import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import {
  getDevtoolsEnabled,
  getUpdateChannelOptions,
  updateConfigValue,
} from '/app/redux/config'

import { UpdateChannel } from '../UpdateChannel'

import type { ComponentProps } from 'react'
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

const mockChannelOptions = [
  {
    label: 'Stable',
    value: 'latest',
  },
  { label: 'Beta', value: 'beta' },
  { label: 'Alpha', value: 'alpha' },
]

const mockhandleBackPress = vi.fn()
const mockPostLogMessage = vi.fn()

const render = (props: ComponentProps<typeof UpdateChannel>) => {
  return renderWithProviders(<UpdateChannel {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UpdateChannel', () => {
  let props: ComponentProps<typeof UpdateChannel>
  beforeEach(() => {
    props = {
      handleBackPress: mockhandleBackPress,
    }
    vi.mocked(getUpdateChannelOptions).mockReturnValue(mockChannelOptions)
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Update channel')
    screen.getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    screen.getByText('Stable')
    screen.getByText('Beta')
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'Warning: alpha releases are feature-complete but may contain significant bugs.'
      )
    ).not.toBeInTheDocument()
  })

  it('should render alpha when dev tools on', () => {
    vi.mocked(getDevtoolsEnabled).mockReturnValue(true)
    render(props)
    screen.getByText('Alpha')
    screen.getByText(
      'Warning: alpha releases are feature-complete but may contain significant bugs.'
    )
  })

  it('should call mock function when tapping a channel button', () => {
    render(props)
    const button = screen.getByText('Stable')
    fireEvent.click(button)
    expect(updateConfigValue).toHaveBeenCalled()
  })

  it('should call mock function when tapping back button', () => {
    render(props)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(props.handleBackPress).toHaveBeenCalled()
  })
})
