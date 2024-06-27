import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { NotConfiguredModal } from '../NotConfiguredModal'
import { useNotifyDeckConfigurationQuery } from '../../../../../resources/deck_configuration'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../../resources/deck_configuration')

const render = (props: React.ComponentProps<typeof NotConfiguredModal>) => {
  return renderWithProviders(<NotConfiguredModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('NotConfiguredModal', () => {
  let props: React.ComponentProps<typeof NotConfiguredModal>
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
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })
  it('renders the correct text and button works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('Add Trash bin to B3')
    getByText(
      'Add this hardware to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Trash bin')
    fireEvent.click(getByRole('button', { name: 'Add' }))
    expect(mockUpdate).toHaveBeenCalled()
  })
})
