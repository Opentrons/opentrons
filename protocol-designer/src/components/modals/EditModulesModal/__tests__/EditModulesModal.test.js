// TODO: IL 2020-02-19 add Flow directive (need to figure out how to flow-ignore mocking, or refactor to avoid mocking)
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { OutlineButton, DropdownField } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { DEFAULT_MODEL_FOR_MODULE_TYPE } from '../../../../constants'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as featureSelectors } from '../../../../feature-flags'
import * as stepFormActions from '../../../../step-forms/actions'
import * as labwareModuleCompatibility from '../../../../utils/labwareModuleCompatibility'
import * as labwareIngredActions from '../../../../labware-ingred/actions'
import { PDAlert } from '../../../alerts/PDAlert'
import { EditModulesModal } from '../'
// only mock actions and selectors from step-forms
jest.mock('../../../../step-forms/actions')
jest.mock('../../../../labware-ingred/actions')
jest.mock('../../../../utils/labwareModuleCompatibility')

describe('EditModulesModal', () => {
  let mockStore
  function render(props) {
    return mount(
      <Provider store={mockStore}>
        <EditModulesModal {...props} />
      </Provider>
    )
  }

  beforeEach(() => {
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    stepFormSelectors.getInitialDeckSetup = jest.fn()
    labwareModuleCompatibility.getLabwareIsCompatible = jest.fn()
    featureSelectors.getDisableModuleRestrictions = jest
      .fn()
      .mockReturnValue(true)
  })

  it('displays warning and disabled save button when slot is occupied by incompatible labware', () => {
    const slot = '1'
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {
        well: {
          slot,
        },
      },
      modules: {},
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible.mockReturnValue(false)
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: slot } })
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(1)
    expect(saveButton.prop('disabled')).toBe(true)
  })

  it('save button is clickable and saves when slot is occupied by compatible labware', () => {
    const slot = '1'
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {
        well: {
          slot,
        },
      },
      modules: {},
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible.mockReturnValue(true)
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: slot } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot,
      type: MAGNETIC_MODULE_TYPE,
      model: DEFAULT_MODEL_FOR_MODULE_TYPE[MAGNETIC_MODULE_TYPE],
    })
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('save button saves when adding module to empty slot', () => {
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {
        well: {
          slot: '1',
        },
      },
      modules: {
        magnet: {
          slot: '3',
        },
      },
      pipettes: {},
    })
    const props = {
      moduleType: TEMPERATURE_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }
    const newSlot = '10'

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: newSlot } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot: newSlot,
      type: TEMPERATURE_MODULE_TYPE,
      model: DEFAULT_MODEL_FOR_MODULE_TYPE[TEMPERATURE_MODULE_TYPE],
    })
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('move deck item when moving module to a different slot', () => {
    const currentSlot = '1'
    const targetSlot = '10'
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {
        well: {
          slot: currentSlot,
        },
      },
      modules: {
        magnet123: {
          slot: currentSlot,
        },
      },
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible.mockReturnValue(true)
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: 'magnet123',
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: targetSlot } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(labwareIngredActions.moveDeckItem).toHaveBeenCalledWith(
      currentSlot,
      targetSlot
    )
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('no warning when slot is occupied by same module', () => {
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {
        well: {
          slot: '1',
        },
      },
      modules: {
        magnet123: {
          slot: '3',
        },
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
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {},
      modules: {},
      pipettes: {},
    })

    const wrapper = render(props)

    const cancelButton = wrapper.find(OutlineButton).at(0)
    cancelButton.simulate('click')
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('slot dropdown is disabled when module restrictions are disabled', () => {
    featureSelectors.getDisableModuleRestrictions = jest
      .fn()
      .mockReturnValue(true)
    const props = {
      moduleType: MAGNETIC_MODULE_TYPE,
      moduleId: null,
      onCloseClick: jest.fn(),
    }
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      labware: {},
      modules: {},
      pipettes: {},
    })

    const wrapper = render(props)

    expect(
      wrapper
        .find('.option_slot')
        .find(DropdownField)
        .prop('disabled')
    ).toBe(false)
  })
})
