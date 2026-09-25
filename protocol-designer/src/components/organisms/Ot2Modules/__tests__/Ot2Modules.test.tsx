import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DeckFromLayers } from '@opentrons/components'
import {
  fixture96Plate,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { MagnetModuleChangeContent } from '/protocol-designer/components/molecules'
import { ConfirmDeleteEntityInUseModal } from '/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal'
import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getDisableModuleRestrictions } from '/protocol-designer/feature-flags/selectors'
import {
  deleteModule,
  getAllModuleSlotsByTypeOt2,
} from '/protocol-designer/modules'
import { createModule } from '/protocol-designer/step-forms/actions'
import { createModuleEntityAndChangeForm } from '/protocol-designer/step-forms/actions/thunks'
import {
  getInitialDeckSetup,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { getDismissedHints } from '/protocol-designer/tutorial/selectors'

import { Ot2Modules } from '..'
import { getModuleOnSlot } from '../util'

import type * as Components from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/step-forms/actions')
vi.mock('/protocol-designer/modules')
vi.mock('/protocol-designer/components/organisms/Kitchen/useKitchen')
vi.mock('/protocol-designer/tutorial/selectors')
vi.mock('/protocol-designer/step-forms/actions/thunks')
vi.mock('/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal')
vi.mock('/protocol-designer/components/molecules')
vi.mock('../util')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckFromLayers: vi.fn(),
  }
})

const render = () => {
  return renderWithProviders(<Ot2Modules />, {
    i18nInstance: i18n,
  })
}

const mockModules = {
  temp: {
    model: TEMPERATURE_MODULE_V1,
    type: TEMPERATURE_MODULE_TYPE,
    id: 'temp',
    pythonName: 'mockPythonName',
    moduleState: {} as any,
    slot: '1',
  },
  mag: {
    model: MAGNETIC_MODULE_V1,
    type: MAGNETIC_MODULE_TYPE,
    id: 'mag',
    pythonName: 'mockPythonName',
    moduleState: {} as any,
    slot: '3',
  },
}
const mockMakeSnackbar = vi.fn()
describe('Ot2Modules', () => {
  beforeEach(() => {
    vi.mocked(MagnetModuleChangeContent).mockReturnValue(
      <div>mock MagnetModuleChangeContent</div>
    )
    vi.mocked(ConfirmDeleteEntityInUseModal).mockReturnValue(
      <div>mock ConfirmDeleteEntityInUseModal</div>
    )
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      eatToast: vi.fn(),
      bakeToast: vi.fn(),
    })
    vi.mocked(getModuleOnSlot).mockReturnValue({
      isModuleInUse: false,
      moduleId: 'temp',
    })
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDismissedHints).mockReturnValue([])
    vi.mocked(getDisableModuleRestrictions).mockReturnValue(false)
    vi.mocked(DeckFromLayers).mockReturnValue(<div>mock DeckFromLayers</div>)
    vi.mocked(getAllModuleSlotsByTypeOt2).mockReturnValue([
      {
        name: '1',
        value: '1',
      },
      {
        name: '3',
        value: '3',
      },
      {
        name: '4',
        value: '4',
      },
    ])
  })

  it('should render all the module buttons and deck and hitting a button calls the createModule action', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      labware: {},
      additionalEquipmentOnDeck: {},
    })
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
      modules: mockModules,
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    screen.getAllByText('Deck slot')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(vi.mocked(deleteModule)).toHaveBeenCalledWith({ moduleId: 'temp' })
  })
  it('shoulder render the conflict in slot due to module snackbar', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: mockModules,
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getAllByText('1')[1])
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Cannot add module to this slot due to a module conflict'
    )
  })
  it('should render the conflict in slot due to labware snackbar', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: mockModules,
      labware: {
        labware: {
          id: 'labware',
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware', '4'],
        },
      },
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByText('4'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Cannot add module to this slot because the ANSI 96 Standard Microplate is incompatible with this module'
    )
  })
  it('should render the conflict in slot due to a labware in tc slot snackbar', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      labware: {
        labware: {
          id: 'labware',
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware', '8'],
        },
      },
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getByText('Thermocycler Module GEN1'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Cannot add the Thermocycler due to a conflict with slot 8.'
    )
  })
  it('should render the conflict in slot due to 3 labware in tc slot snackbar', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      labware: {
        labware: {
          id: 'labware',
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware', '8'],
        },
        labware2: {
          id: 'labware2',
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware2', '10'],
        },
        labware3: {
          id: 'labware3',
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware3', '11'],
        },
      },
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getByText('Thermocycler Module GEN1'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Cannot add the Thermocycler due to conflicts with slots 8, 10 and 11.'
    )
  })
  it('should call the createModuleEntityAndChangeForm action when moving a module in use', () => {
    vi.mocked(getModuleOnSlot).mockReturnValue({
      isModuleInUse: true,
      moduleId: 'temp',
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: mockModules,
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByText('4'))
    expect(vi.mocked(createModuleEntityAndChangeForm)).toHaveBeenCalledWith({
      model: MAGNETIC_MODULE_V1,
      moduleSteps: [],
      pauseSteps: [],
      slot: '4',
      type: MAGNETIC_MODULE_TYPE,
    })
  })
  it('should render the ConfirmDeleteEntityInUseModal when trying to delete a module in use', () => {
    vi.mocked(getModuleOnSlot).mockReturnValue({
      isModuleInUse: true,
      moduleId: 'temp',
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: mockModules,
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    screen.getByText('mock ConfirmDeleteEntityInUseModal')
  })
})
