import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { NotConfiguredModal } from '../NotConfiguredModal'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: vi
    .fn()
    .mockReturnValue(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
}))

const render = (props: ComponentProps<typeof NotConfiguredModal>) => {
  return renderWithProviders(<NotConfiguredModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('NotConfiguredModal', () => {
  let props: ComponentProps<typeof NotConfiguredModal>
  const mockUpdate = vi.fn()
  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      cutoutId: 'cutoutB3',
      requiredFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdate,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as unknown as UseQueryResult<DeckConfiguration>)
  })
  it('renders the correct text and button works as expected', () => {
    render(props)
    screen.getByText('Add Trash bin to B3')
    screen.getByText(
      'Add this hardware to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Trash bin')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(mockUpdate).toHaveBeenCalled()
  })
})
