import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, describe, expect, beforeEach } from 'vitest'

import { DeckConfigurator } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { DeckFixtureSetupInstructionsModal } from '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationEditor } from '..'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
import { fireEvent, screen } from '@testing-library/react'
import type * as Components from '@opentrons/components'
import type * as ReactRouterDom from 'react-router-dom'

const mockUpdateDeckConfiguration = vi.fn()
const mockGoBack = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useHistory: () => ({ goBack: mockGoBack } as any),
  }
})
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})

const mockDeckConfig = [
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
  },
]

vi.mock('@opentrons/react-api-client')
vi.mock(
  '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
)
vi.mock(
  '../../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
)

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DeckConfigurationEditor />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeckConfigurationEditor', () => {
  beforeEach(() => {
    vi.mocked(useDeckConfigurationQuery).mockReturnValue({
      data: mockDeckConfig,
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
  })

  it('should render text, button and DeckConfigurator', () => {
    render()
    screen.getByText('Deck configuration')
    screen.getByText('Setup Instructions')
    screen.getByText('Confirm')
    expect(vi.mocked(DeckConfigurator)).toHaveBeenCalled()
  })

  it('should display setup instructions modal when tapping setup instructions button', async () => {
    render()
    fireEvent.click(screen.getByText('Setup Instructions'))
    expect(vi.mocked(DeckFixtureSetupInstructionsModal)).toHaveBeenCalled()
  })

  it('should call a mock function when tapping confirm', () => {
    // (kk:10/26/2023)
    // Once get approval, I will be able to update this case
    // render()
    // screen.getByText('Confirm').click()
    // expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should call a mock function when tapping back button if there is no change', () => {
    render()
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('should render modal when tapping back button if there is a change', () => {
    // (kk:10/26/2023)
    // Once get approval, I will be able to update this case
    // render()
    // screen.getByTestId('ChildNavigation_Back_Button').click()
    // expect(mockGoBack).toHaveBeenCalled()
  })
})
