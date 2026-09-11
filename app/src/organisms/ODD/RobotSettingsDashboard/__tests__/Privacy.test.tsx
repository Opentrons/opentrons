import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { toggleAnalyticsOptedIn } from '/app/redux/analytics'

import { Privacy } from '../Privacy'

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
vi.mock('/app/redux/analytics')

const mockPostLogMessage = vi.fn()

const render = (props: ComponentProps<typeof Privacy>) => {
  return renderWithProviders(<Privacy {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Privacy', () => {
  let props: ComponentProps<typeof Privacy>
  beforeEach(() => {
    props = {
      robotName: 'Otie',
      setCurrentOption: vi.fn(),
    }
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Privacy')
    screen.getByText(
      'Opentrons cares about your privacy. We anonymize all data and only use it to improve our products.'
    )
    screen.getByText('Share display usage')
    screen.getByText('Data on how you interact with the touchscreen on Flex.')
  })

  it('should toggle display usage sharing on click', () => {
    render(props)
    fireEvent.click(screen.getByText('Share display usage'))
    expect(vi.mocked(toggleAnalyticsOptedIn)).toBeCalled()
  })
})
