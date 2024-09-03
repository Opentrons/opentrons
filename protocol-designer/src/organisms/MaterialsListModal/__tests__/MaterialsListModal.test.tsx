import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { MaterialsListModal } from '..'

import type { InfoScreen } from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InfoScreen>()
  return {
    ...actual,
    InfoScreen: () => <div>mock InfoScreen</div>,
  }
})

const mockSetShowMaterialsListModal = vi.fn()

const mockHardWare = [
  {
    id: 'mockHardware',
    model: 'temperatureModuleV2',
    moduleState: {
      type: 'temperatureModuleType',
      status: 'TEMPERATURE_DEACTIVATED',
      targetTemperature: null,
    },
    slot: 'C1',
    type: 'temperatureModuleType',
  },
]

const mockLabware = [
  {
    def: {
      metadata: {
        displayCategory: 'tipRack',
        displayName: 'Opentrons Flex 96 Filter Tip Rack 50 µL',
        displayVolumeUnits: 'µL',
        tags: [],
        namespace: 'opentrons',
      },
    },
    id: 'mockLabware',
    labwareDefURI: 'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
    slot: 'D3',
  },
]

const render = (props: React.ComponentProps<typeof MaterialsListModal>) => {
  return renderWithProviders(<MaterialsListModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MaterialsListModal', () => {
  let props: React.ComponentProps<typeof MaterialsListModal>

  beforeEach(() => {
    props = {
      hardware: [],
      labware: [],
      liquids: [],
      setShowMaterialsListModal: mockSetShowMaterialsListModal,
    }
  })

  it('should render render text', () => {
    render(props)
    screen.getByText('Materials list')
    screen.getByText('Deck hardware')
    screen.getByText('Labware')
    screen.getByText('Liquids')
  })

  it('should render InfoScreen component', () => {
    render(props)
    expect(screen.getAllByText('mock InfoScreen').length).toBe(3)
  })

  it('should render hardware info', () => {
    props = {
      ...props,
      hardware: mockHardWare,
    }
    render(props)
    screen.getByText('C1')
    screen.getByText('Temperature Module GEN2')
  })
  it('should render labware info', () => {
    props = {
      ...props,
      labware: mockLabware,
    }
    render(props)
    screen.getByText('D3')
    screen.getByText('Opentrons Flex 96 Filter Tip Rack 50 µL')
  })

  // ToDo (kk:09/03/2024) add test when implementing liquids part completely
  it.todo('should render liquids info', () => {})
})
