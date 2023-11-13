import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { renderWithProviders } from '@opentrons/components'
import {
  DeckConfiguration,
  STAGING_AREA_LOAD_NAME,
  Fixture,
  TRASH_BIN_LOAD_NAME,
} from '@opentrons/shared-data'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client/src/deck_configuration'
import { i18n } from '../../../../../i18n'
import { LocationConflictModal } from '../LocationConflictModal'

jest.mock('@opentrons/react-api-client/src/deck_configuration')

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>

const mockFixture = {
  fixtureId: 'mockId',
  fixtureLocation: 'cutoutB3',
  loadName: STAGING_AREA_LOAD_NAME,
} as Fixture

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
      cutout: 'cutoutB3',
      requiredFixture: TRASH_BIN_LOAD_NAME,
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
    getAllByText('Staging Area Slot')
    getByText('Trash Bin')
    getByRole('button', { name: 'Cancel' }).click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByRole('button', { name: 'Update deck' }).click()
    expect(mockUpdate).toHaveBeenCalled()
  })
  it('should render the modal information for a module fixture conflict', () => {
    props = {
      onCloseClick: jest.fn(),
      cutout: 'cutoutB3',
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
    getAllByText('Staging Area Slot')
    getByText('Trash Bin')
    getByText('Cancel').click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByText('Confirm removal').click()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
