import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  DeckLocationSelect,
  renderWithProviders,
  SlotMap,
} from '@opentrons/components'
import { i18n } from '../../../../localization'
import { getRobotType } from '../../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import { getDisableModuleRestrictions } from '../../../../feature-flags/selectors'
import { ConnectedSlotMap } from '../ConnectedSlotMap'
import { EditModulesModal } from '../index'
import type { ModuleOnDeck } from '../../../../step-forms'

jest.mock('../ConnectedSlotMap')
jest.mock('../../../../file-data/selectors')
jest.mock('../../../../step-forms/selectors')
jest.mock('../../../../utils/labwareModuleCompatibility')
jest.mock('../../../../feature-flags/selectors')
jest.mock('@opentrons/components/src/hooks/useSelectDeckLocation/index')
jest.mock('@opentrons/components/src/slotmap/SlotMap')

const mockGetRobotType = getRobotType as jest.MockedFunction<
  typeof getRobotType
>
const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockDeckLocationSelect = DeckLocationSelect as jest.MockedFunction<
  typeof DeckLocationSelect
>

const mockGetLabwareIsCompatible = getLabwareIsCompatible as jest.MockedFunction<
  typeof getLabwareIsCompatible
>
const mockGetDisableModuleRestrictions = getDisableModuleRestrictions as jest.MockedFunction<
  typeof getDisableModuleRestrictions
>
const mockConnectedSlotMap = ConnectedSlotMap as jest.MockedFunction<
  typeof ConnectedSlotMap
>
const mockSlotMap = SlotMap as jest.MockedFunction<typeof SlotMap>
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
      onCloseClick: jest.fn(),
      editModuleModel: jest.fn(),
      editModuleSlot: jest.fn(),
      displayModuleWarning: jest.fn(),
    }
    mockGetRobotType.mockReturnValue(FLEX_ROBOT_TYPE)
    mockGetInitialDeckSetup.mockReturnValue({
      modules: {
        heaterShakerId: mockHS,
        temperatureId: mockTemp,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    mockGetLabwareIsCompatible.mockReturnValue(true)
    mockGetDisableModuleRestrictions.mockReturnValue(false)
    mockDeckLocationSelect.mockReturnValue(<div>mock DeckLocationSelect</div>)
    mockConnectedSlotMap.mockReturnValue(<div>mock ConnectedSlotMap</div>)
    mockSlotMap.mockReturnValue(<div>mock SlotMap</div>)
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
    mockGetRobotType.mockReturnValue(OT2_ROBOT_TYPE)
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
    mockGetRobotType.mockReturnValue(OT2_ROBOT_TYPE)
    mockGetInitialDeckSetup.mockReturnValue({
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
    screen.getByText('Cannot place module')
    screen.getByText('mock SlotMap')
  })
  it('renders a heater-shaker for flex and can select different slots', () => {
    mockGetInitialDeckSetup.mockReturnValue({
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
