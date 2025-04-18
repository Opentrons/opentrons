import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import {
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { DeckFromLayers, DropdownMenu } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getDisableModuleRestrictions } from '../../../feature-flags/selectors'
import { deleteModule, getAllModuleSlotsByTypeOt2 } from '../../../modules'
import { createModule } from '../../../step-forms/actions'
import { Ot2Modules } from '../Ot2Modules'
import type * as Components from '@opentrons/components'

vi.mock('../../../feature-flags/selectors')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../step-forms/actions')
vi.mock('../../../modules')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckFromLayers: vi.fn(),
    DropdownMenu: vi.fn(),
  }
})

const render = () => {
  return renderWithProviders(<Ot2Modules />, {
    i18nInstance: i18n,
  })
}

describe('Ot2Modules', () => {
  beforeEach(() => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(getDisableModuleRestrictions).mockReturnValue(false)
    vi.mocked(DeckFromLayers).mockReturnValue(<div>mock DeckFromLayers</div>)
    vi.mocked(DropdownMenu).mockReturnValue(<div>mock DropdownMenu</div>)
    vi.mocked(getAllModuleSlotsByTypeOt2).mockReturnValue([
      {
        name: '1',
        value: '1',
      },
    ])
  })

  it('should render all the module buttons and deck and hitting a button calls the createModule action', () => {
    render()
    screen.getByText('Modules')
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Magnetic Module GEN1')
    screen.getByText('Magnetic Module GEN2')
    screen.getByText('Temperature Module GEN2')
    screen.getByText('Temperature Module GEN1')
    screen.getByText('Thermocycler Module GEN2')
    fireEvent.click(screen.getByText('Thermocycler Module GEN1'))
    expect(vi.mocked(createModule)).toHaveBeenCalledWith({
      slot: '7',
      model: THERMOCYCLER_MODULE_V1,
      type: THERMOCYCLER_MODULE_TYPE,
    })
    screen.getByText('mock DeckFromLayers')
  })
  it('should render a temperature module on slot 1 and removing it calls the deleteModule action', () => {
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
    render()
    screen.getByText('Deck slot')
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(vi.mocked(deleteModule)).toHaveBeenCalledWith({ moduleId: 'temp' })
  })
})
