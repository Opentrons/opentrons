import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { renderWithProviders } from '@opentrons/components'
import {
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client/src/deck_configuration'
import { i18n } from '../../../../../i18n'
import { LocationConflictModal } from '../LocationConflictModal'

import type { DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client/src/deck_configuration')

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>

const mockFixture = {
  cutoutId: 'cutoutB3',
  cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
}

const render = (props: React.ComponentProps<typeof LocationConflictModal>) => {
  return renderWithProviders(<LocationConflictModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LocationConflictModal', () => {
  let props: React.ComponentProps<typeof LocationConflictModal>
  const mockUpdate = jest.fn()
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      cutoutId: 'cutoutB3',
      requiredFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    }
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<DeckConfiguration>)
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdate,
    } as any)
  })
  it('should render the modal information for a fixture conflict', () => {
    const { getByText, getAllByText, getByRole } = render(props)
    getByText('Deck location conflict')
    getByText('Slot B3')
    getByText('Protocol specifies')
    getByText('Currently configured')
    getAllByText('Staging area slot')
    getByText('Trash bin')
    getByRole('button', { name: 'Cancel' }).click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByRole('button', { name: 'Update deck' }).click()
    expect(mockUpdate).toHaveBeenCalled()
  })
  it('should render the modal information for a module fixture conflict', () => {
    props = {
      onCloseClick: jest.fn(),
      cutoutId: 'cutoutB3',
      requiredModule: 'heaterShakerModuleV1',
    }
    const { getByText, getByRole } = render(props)
    getByText('Protocol specifies')
    getByText('Currently configured')
    getByText('Heater-Shaker Module GEN1')
    getByRole('button', { name: 'Cancel' }).click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByRole('button', { name: 'Update deck' }).click()
    expect(mockUpdate).toHaveBeenCalled()
  })
  it('should render correct info for a odd', () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByText, getAllByText } = render(props)
    getByText('Deck location conflict')
    getByText('Slot B3')
    getByText('Protocol specifies')
    getByText('Currently configured')
    getAllByText('Staging area slot')
    getByText('Trash bin')
    getByText('Cancel').click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByText('Confirm removal').click()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
