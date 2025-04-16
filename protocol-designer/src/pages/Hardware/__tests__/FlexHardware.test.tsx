import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
} from '../../../step-forms/selectors'
import { FlexHardware } from '../FlexHardware'
import { DeckConfigurator } from '@opentrons/components'

vi.mock('../../../step-forms/selectors')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof DeckConfigurator>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})

const render = () => {
  return renderWithProviders(<FlexHardware />, {
    i18nInstance: i18n,
  })
}

describe('FlexHardware', () => {
  beforeEach(() => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {
        temp: {
          model: 'temperatureModuleV1',
          type: 'temperatureModuleType',
          id: 'temp',
          pythonName: 'mockPythonName',
          moduleState: {} as any,
          slot: '1',
        },
      },
      labware: {},
      additionalEquipmentOnDeck: {},
    })
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
