import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { TRASH_BIN_LOAD_NAME } from '@opentrons/shared-data'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client/src/deck_configuration'
import { i18n } from '../../../../../i18n'
import { NotConfiguredModal } from '../NotConfiguredModal'

jest.mock('@opentrons/react-api-client/src/deck_configuration')

const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
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
      cutout: 'cutoutB3',
      requiredFixture: TRASH_BIN_LOAD_NAME,
    }
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdate,
    } as any)
  })
  it('renders the correct text and button works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('Add Trash Bin to deck configuration')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Trash Bin')
    getByRole('button', { name: 'Add' }).click()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
