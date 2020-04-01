// @flow

import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { OutlineButton, DropdownField } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V2,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  type LabwareDefinition2,
  type ModuleRealType,
} from '@opentrons/shared-data'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import {
  selectors as stepFormSelectors,
  type InitialDeckSetup,
} from '../../../../step-forms'
import { selectors as featureSelectors } from '../../../../feature-flags'
import * as stepFormActions from '../../../../step-forms/actions'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import * as labwareIngredActions from '../../../../labware-ingred/actions'
import { SUPPORTED_MODULE_SLOTS } from '../../../../modules'
import { PDAlert } from '../../../alerts/PDAlert'
import { useBlockingHint } from '../../../Hints/useBlockingHint'
import { EditModulesModal } from '../'

import type { Node } from 'react'
import type { BaseState } from '../../../../types'

// only mock actions and selectors from step-forms
jest.mock('../../../../step-forms/actions')
jest.mock('../../../../step-forms/selectors')
jest.mock('../../../../labware-ingred/actions')
jest.mock('../../../../utils/labwareModuleCompatibility')
jest.mock('../../../../feature-flags')
jest.mock('../../../Hints/useBlockingHint')

const getInitialDeckSetupMock: JestMockFn<[BaseState], InitialDeckSetup> =
  stepFormSelectors.getInitialDeckSetup
const getLabwareIsCompatibleMock: JestMockFn<
  [LabwareDefinition2, ModuleRealType],
  boolean
> = getLabwareIsCompatible
const getDisableModuleRestrictionsMock: JestMockFn<[BaseState], ?boolean> =
  featureSelectors.getDisableModuleRestrictions
const useBlockingHintMock: JestMockFn<any, ?Node> = useBlockingHint

describe('EditModulesModal', () => {
  const slotDropdownName = 'selectedSlot'
  const modelDropdownName = 'selectedModel'
  const modelDropdownSelector = `select[name="${modelDropdownName}"]`
  const slotDropdownSelector = `select[name="${slotDropdownName}"]`
  let mockStore
  function render(props) {
    return mount(
      <Provider store={mockStore}>
        <EditModulesModal {...props} />
      </Provider>
    )
  }

  function simulateRunAllAsyncEvents() {
    return new Promise(resolve => setTimeout(resolve, 0))
  }

  let magneticModule, emptyDeckState, addMagneticModuleProps
  beforeEach(() => {
    jest.clearAllMocks()
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    useBlockingHintMock.mockReturnValue(null)

    magneticModule = {
      id: 'magnet123',
      slot: '3',
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      moduleState: {
        engaged: false,
        type: MAGNETIC_MODULE_TYPE,
      },
    }
    emptyDeckState = {
      labware: {},
      modules: {},
      pipettes: {},
    }
    addMagneticModuleProps = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    getDisableModuleRestrictionsMock.mockReturnValue(true)
  })

  it('displays warning and disabled save button when slot is occupied by incompatible labware', () => {
    const slot = '1'
    getInitialDeckSetupMock.mockReturnValue({
      labware: {
        well96Id: {
          ...fixture_96_plate,
          slot,
        },
      },
      modules: {},
      pipettes: {},
    })
    getLabwareIsCompatibleMock.mockReturnValue(false)

    const wrapper = render(addMagneticModuleProps)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find(slotDropdownSelector)
    slotDropdown.simulate('change', {
      target: { name: slotDropdownName, value: slot },
    })
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(1)
    expect(saveButton.prop('disabled')).toBe(true)
  })

  it('save button is clickable and saves when model is selected and slot is occupied by compatible labware', async () => {
    const slot = '1'
    getInitialDeckSetupMock.mockReturnValue({
      labware: {
        well96Id: {
          ...fixture_96_plate,
          slot,
        },
      },
      modules: {},
      pipettes: {},
    })
    getLabwareIsCompatibleMock.mockReturnValue(true)

    const wrapper = render(addMagneticModuleProps)
    const slotDropdown = wrapper.find(slotDropdownSelector)
    slotDropdown.simulate('change', {
      target: { name: slotDropdownName, value: slot },
    })
    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V1 },
    })
    const saveButton = wrapper.find(OutlineButton).at(1)
    saveButton.simulate('click')
    await simulateRunAllAsyncEvents()
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot,
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
    })
    expect(addMagneticModuleProps.onCloseClick).toHaveBeenCalled()
  })

  it('save button saves when adding module to empty slot', async () => {
    getInitialDeckSetupMock.mockReturnValue({
      labware: {
        well96Id: fixture_96_plate,
      },
      modules: {
        magnet123: magneticModule,
      },
      pipettes: {},
    })
    const props = {
      moduleType: TEMPERATURE_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }
    const newSlot = '9'

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find(slotDropdownSelector)
    slotDropdown.simulate('change', {
      target: { name: slotDropdownName, value: newSlot },
    })
    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: 'selectedModel', value: TEMPERATURE_MODULE_V1 },
    })
    saveButton.simulate('click')
    await simulateRunAllAsyncEvents()
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot: newSlot,
      type: TEMPERATURE_MODULE_TYPE,
      model: TEMPERATURE_MODULE_V1,
    })
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('move deck item when moving module to a different slot', async () => {
    const currentSlot = '1'
    const targetSlot = '9'
    getInitialDeckSetupMock.mockReturnValue({
      labware: {
        wellId: {
          ...fixture_96_plate,
          slot: currentSlot,
        },
      },
      modules: {
        magnet123: {
          ...magneticModule,
          slot: currentSlot,
        },
      },
      pipettes: {},
    })
    getLabwareIsCompatibleMock.mockReturnValue(true)
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: 'magnet123',
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find(slotDropdownSelector)
    slotDropdown.simulate('change', {
      target: { name: slotDropdownName, value: targetSlot },
    })
    saveButton.simulate('click')
    await simulateRunAllAsyncEvents()
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(labwareIngredActions.moveDeckItem).toHaveBeenCalledWith(
      currentSlot,
      targetSlot
    )
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('no warning when slot is occupied by same module', () => {
    getInitialDeckSetupMock.mockReturnValue({
      labware: {
        wellId: {
          ...fixture_96_plate,
          slot: '1',
        },
      },
      modules: {
        magnet123: magneticModule,
      },
      pipettes: {},
    })
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: 'magnet123',
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
  })

  it('cancel calls onCloseClick to close modal', () => {
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    const cancelButton = wrapper.find(OutlineButton).at(0)
    cancelButton.simulate('click')

    expect(addMagneticModuleProps.onCloseClick).toHaveBeenCalled()
  })

  it('slot dropdown is disabled when module restrictions are enabled', () => {
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)

    expect(wrapper.find(slotDropdownSelector).prop('disabled')).toBe(true)
  })

  it('allows slot options when module restrictions are disabled', () => {
    getDisableModuleRestrictionsMock.mockReturnValue(true)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)

    expect(wrapper.find(slotDropdownSelector).prop('disabled')).toBe(false)
  })

  it('allows slot options when modules do not have collisions', () => {
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V2 },
    })

    expect(wrapper.find(slotDropdownSelector).prop('disabled')).toBe(false)
  })

  it('has error when clicking save button when no model is selected', async () => {
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    const saveButton = wrapper.find(OutlineButton).at(1)
    saveButton.simulate('click')
    await simulateRunAllAsyncEvents()
    wrapper.update()

    expect(
      wrapper
        .find(DropdownField)
        .filter({ name: modelDropdownName })
        .prop('error')
    ).toBe('This field is required')
  })

  it('only allows default slot if module has collision issue and module restrictions are enabled', () => {
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V1 },
    })
    const slotDropdown = wrapper.find(slotDropdownSelector)

    expect(slotDropdown.prop('disabled')).toBe(true)
    expect(slotDropdown.prop('value')).toBe(
      SUPPORTED_MODULE_SLOTS[MAGNETIC_MODULE_TYPE][0].value
    )
  })

  it('resets the slot to default when switching from module without collision issue to one that does', async () => {
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V2 },
    })
    const slotDropdown = wrapper.find(slotDropdownSelector)
    slotDropdown.simulate('change', {
      target: { name: slotDropdownName, value: '9' },
    })
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V1 },
    })
    await simulateRunAllAsyncEvents()
    wrapper.update()
    const updatedSlotDropdown = wrapper.find(slotDropdownSelector)

    expect(updatedSlotDropdown.prop('disabled')).toBe(true)
    expect(updatedSlotDropdown.prop('value')).toBe(
      SUPPORTED_MODULE_SLOTS[MAGNETIC_MODULE_TYPE][0].value
    )
  })

  it('renders blocking hint when useBlockingHint returns a component', () => {
    const WarningModal = () => <div>warning modal</div>
    useBlockingHintMock.mockReturnValue(<WarningModal />)
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue(emptyDeckState)

    const wrapper = render(addMagneticModuleProps)
    expect(wrapper.find(WarningModal)).toHaveLength(1)
  })

  it('uses blocking hint if existing magnetic module model is changed', async () => {
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getInitialDeckSetupMock.mockReturnValue({
      ...emptyDeckState,
      modules: {
        someMagModuleId: {
          id: 'someMagModuleId',
          model: MAGNETIC_MODULE_V1,
          type: MAGNETIC_MODULE_TYPE,
          slot: '1',
          moduleState: { engaged: false, type: MAGNETIC_MODULE_TYPE },
        },
      },
    })

    const wrapper = render({
      ...addMagneticModuleProps,
      moduleId: 'someMagModuleId',
    })

    // blocking hint initially NOT 'enabled'
    expect(useBlockingHintMock).toHaveBeenCalledWith({
      hintKey: 'change_magnet_module_model',
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
      content: expect.anything(),
      enabled: false,
    })

    const modelDropdown = wrapper.find(modelDropdownSelector)
    modelDropdown.simulate('change', {
      target: { name: modelDropdownName, value: MAGNETIC_MODULE_V2 },
    })
    const saveButton = wrapper.find(OutlineButton).at(1)
    saveButton.simulate('click')
    await simulateRunAllAsyncEvents()

    // blocking hint 'enabled' after save
    expect(useBlockingHintMock).toHaveBeenLastCalledWith({
      hintKey: 'change_magnet_module_model',
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
      content: expect.anything(),
      enabled: true,
    })
  })
})
