import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  SINGLE_RIGHT_SLOT_FIXTURE,
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
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render the modal information for a fixture conflict', () => {
    render(props)
    screen.getByText('Deck location conflict')
    screen.getByText('Slot B3')
    screen.getByText('Protocol specifies')
    screen.getByText('Currently configured')
    screen.getAllByText('Staging area slot')
    screen.getByText('Trash bin')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Update deck' }))
    expect(mockUpdate).toHaveBeenCalled()
  })
  it('should render the modal information for a module fixture conflict', () => {
    props = {
      onCloseClick: jest.fn(),
      cutoutId: 'cutoutB3',
      requiredModule: 'heaterShakerModuleV1',
    }
    render(props)
    screen.getByText('Protocol specifies')
    screen.getByText('Currently configured')
    screen.getByText('Heater-Shaker Module GEN1')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Update deck' }))
    expect(mockUpdate).toHaveBeenCalled()
  })
  it('should render the modal information for a single slot fixture conflict', () => {
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB1',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
        },
      ],
    } as UseQueryResult<DeckConfiguration>)
    props = {
      onCloseClick: jest.fn(),
      cutoutId: 'cutoutB1',
      requiredFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
      missingLabwareDisplayName: 'a tiprack',
    }
    const { getByText, getAllByText, getByRole } = render(props)
    getByText('Deck location conflict')
    getByText('Slot B1')
    getByText('Protocol specifies')
    getByText('Currently configured')
    getAllByText('Trash bin')
    getByText('a tiprack')
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
    render(props)
    screen.getByText('Deck location conflict')
    screen.getByText('Slot B3')
    screen.getByText('Protocol specifies')
    screen.getByText('Currently configured')
    screen.getAllByText('Staging area slot')
    screen.getByText('Trash bin')
    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Update deck'))
    expect(mockUpdate).toHaveBeenCalled()
  })
})
