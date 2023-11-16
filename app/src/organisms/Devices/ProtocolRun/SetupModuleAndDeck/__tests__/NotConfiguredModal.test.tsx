import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client/src/deck_configuration'
import { i18n } from '../../../../../i18n'
import { NotConfiguredModal } from '../NotConfiguredModal'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client/src/deck_configuration')

const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

const render = (props: React.ComponentProps<typeof NotConfiguredModal>) => {
  return renderWithProviders(<NotConfiguredModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('NotConfiguredModal', () => {
  let props: React.ComponentProps<typeof NotConfiguredModal>
  const mockUpdate = jest.fn()
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      cutoutId: 'cutoutB3',
      requiredFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    }
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdate,
    } as any)
    mockUseDeckConfigurationQuery.mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })
  it('renders the correct text and button works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('Add Trash bin to deck configuration')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Trash bin')
    getByRole('button', { name: 'Add' }).click()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
