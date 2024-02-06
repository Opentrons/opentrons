import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { getRobotType } from '../../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import { getDisableModuleRestrictions } from '../../../../feature-flags/selectors'
import { ConnectedSlotMap } from '../ConnectedSlotMap'
import { EditModulesModal } from '../index'
import type * as Components from '@opentrons/components'
import type { ModuleOnDeck } from '../../../../step-forms'

vi.mock('../ConnectedSlotMap')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../utils/labwareModuleCompatibility')
vi.mock('../../../../feature-flags/selectors')
vi.mock('@opentrons/components', async (importOriginal) => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckLocationSelect: vi.fn(() => (<div>mock DeckLocationSelect</div>)),
    SlotMap: vi.fn(() => (<div>mock SlotMap</div>))
  }
})

const render = (props: React.ComponentProps<typeof EditModulesModal>) => {
  return renderWithProviders(<EditModulesModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockTemp: ModuleOnDeck = {
  id: 'temperatureId',
  type: 'temperatureModuleType',
  model: 'temperatureModuleV2',
  slot: 'C3',
  moduleState: {} as any,
}

const mockTC: ModuleOnDeck = {
  id: 'thermocyclerId',
  type: 'thermocyclerModuleType',
  model: 'thermocyclerModuleV2',
  slot: '10',
  moduleState: {} as any,
}

const mockHS: ModuleOnDeck = {
  id: 'heaterShakerId',
  type: 'heaterShakerModuleType',
  model: 'heaterShakerModuleV1',
  moduleState: {} as any,
  slot: 'A3',
}

describe('Edit Modules Modal', () => {
  let props: React.ComponentProps<typeof EditModulesModal>
  beforeEach(() => {
    props = {
      moduleType: 'temperatureModuleType',
      moduleOnDeck: mockTemp,
      onCloseClick: vi.fn(),
      editModuleModel: vi.fn(),
      editModuleSlot: vi.fn(),
      displayModuleWarning: vi.fn(),
    }
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        heaterShakerId: mockHS,
        temperatureId: mockTemp,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    vi.mocked(getLabwareIsCompatible).mockReturnValue(true)
    vi.mocked(getDisableModuleRestrictions).mockReturnValue(false)
    vi.mocked(ConnectedSlotMap).mockReturnValue(<div>mock ConnectedSlotMap</div>)
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the edit modules modal for a temp on a flex', () => {
    render(props)
    screen.getByText('Temperature module')
    screen.getByText('mock DeckLocationSelect')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    screen.getByRole('button', { name: 'save' })
  })
  it('renders the edit modules modal for temp gen2 on an ot-2 and selects other model', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render(props)
    screen.getByText('Temperature module')
    screen.getByText('mock ConnectedSlotMap')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    screen.getByRole('button', { name: 'save' })
    //  click on Temp GEN 1 from model dropdown
    const comboboxes = screen.getAllByRole('combobox')
    const selectModel = comboboxes[0]
    fireEvent.change(selectModel, {
      target: { value: 'temperatureModuleV1' },
    })
    fireEvent.click(selectModel)
  })
  it('renders the TC for an ot-2 and there is a slot conflict', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        heaterShakerId: {
          id: 'heaterShakerId',
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
          moduleState: {} as any,
          slot: '7',
        } as any,
        temperatureId: mockTemp,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    props.moduleType = 'thermocyclerModuleType'
    props.moduleOnDeck = mockTC
    render(props)
    screen.getByText('Thermocycler module')
    screen.getByText('warning')
    screen.getByText(
      'Slot 10 is occupied by a Heater-Shaker. Other modules cannot be placed in front of or behind a Heater-Shaker.'
    )
    screen.getByText('mock SlotMap')
  })
  it('renders a heater-shaker for flex and can select different slots', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        heaterShakerId: mockHS,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    props.moduleType = 'heaterShakerModuleType'
    props.moduleOnDeck = mockHS
    render(props)
    screen.getByText('Heater-Shaker module')
    //  click on slot B3 from slot dropdown
    const comboboxes = screen.getAllByRole('combobox')
    const selectSlot = comboboxes[0]
    fireEvent.change(selectSlot, {
      target: { value: 'B3' },
    })
    fireEvent.click(selectSlot)
  })
})
