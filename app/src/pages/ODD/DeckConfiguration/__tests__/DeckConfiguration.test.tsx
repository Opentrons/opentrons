import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DeckConfigurator } from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { DeckFixtureSetupInstructionsModal } from '/app/organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import {
  useDeckConfigurationEditingTools,
  useNotifyDeckConfigurationQuery,
} from '/app/resources/deck_configuration'

import { DeckConfigurationEditor } from '..'

import type { UseQueryResult } from 'react-query'
import type { NavigateFunction } from 'react-router-dom'
import type * as Components from '@opentrons/components'
import type { DeckConfiguration } from '@opentrons/shared-data'

const mockUpdateDeckConfiguration = vi.fn()
const mockGoBack = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockGoBack,
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
  '/app/organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
)
vi.mock(
  '/app/organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
)
vi.mock('/app/resources/deck_configuration')

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
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: mockDeckConfig,
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useDeckConfigurationEditingTools).mockReturnValue({
      addFixtureToCutout: vi.fn(),
      removeFixtureFromCutout: vi.fn(),
      addFixtureModal: null,
    })
  })

  it('should render text, button and DeckConfigurator', () => {
    render()
    screen.getByText('Deck configuration')
    screen.getByText('Setup Instructions')
    screen.getByText('Save')
    expect(vi.mocked(DeckConfigurator)).toHaveBeenCalled()
  })

  it('should display setup instructions modal when tapping setup instructions button', async () => {
    render()
    fireEvent.click(screen.getByText('Setup Instructions'))
    expect(vi.mocked(DeckFixtureSetupInstructionsModal)).toHaveBeenCalled()
  })
})
