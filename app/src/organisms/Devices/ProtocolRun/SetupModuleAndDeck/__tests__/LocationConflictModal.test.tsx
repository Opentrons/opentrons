import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import {
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../../../i18n'
import { LocationConflictModal } from '../LocationConflictModal'

import type { DeckConfiguration } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')

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
  const mockUpdate = vi.fn()
  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      cutoutId: 'cutoutB3',
      requiredFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    }
    vi.mocked(useDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdate,
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
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
      onCloseClick: vi.fn(),
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
    vi.mocked(useDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB1',
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
        },
      ],
    } as UseQueryResult<DeckConfiguration>)
    props = {
      onCloseClick: vi.fn(),
      cutoutId: 'cutoutB1',
      requiredFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
      missingLabwareDisplayName: 'a tiprack',
    }
    render(props)
    screen.getByText('Deck location conflict')
    screen.getByText('Slot B1')
    screen.getByText('Protocol specifies')
    screen.getByText('Currently configured')
    screen.getAllByText('Trash bin')
    screen.getByText('a tiprack')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Update deck' }))
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
