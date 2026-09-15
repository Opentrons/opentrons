import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { DeckConfigurator } from '@opentrons/components'
import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import {
  getAdditionalEquipmentEntities,
  getDeckConfiguration,
  getInitialDeckSetup,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'

import { FlexHardware } from '..'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/components/organisms/Kitchen/useKitchen')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof DeckConfigurator>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})
vi.mock('/protocol-designer/feature-flags/selectors')
const render = () => {
  return renderWithProviders(<FlexHardware />, {
    i18nInstance: i18n,
  })
}

describe('FlexHardware', () => {
  beforeEach(() => {
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: vi.fn(),
      eatToast: vi.fn(),
      bakeToast: vi.fn(),
    })
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {
        temp: {
          model: TEMPERATURE_MODULE_V1,
          type: TEMPERATURE_MODULE_TYPE,
          id: 'temp',
          pythonName: 'mockPythonName',
          moduleState: {} as any,
          slot: '1',
        },
      },
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(getDeckConfiguration).mockReturnValue({ deckConfig: [] })
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(DeckConfigurator).mockReturnValue(
      <div>mock DeckConfigurator</div>
    )
  })

  it('should render the deck configurator', () => {
    render()
    screen.getByText('mock DeckConfigurator')
  })
})
