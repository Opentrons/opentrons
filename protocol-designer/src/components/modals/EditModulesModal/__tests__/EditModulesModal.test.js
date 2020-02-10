import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { OutlineButton } from '@opentrons/components'
import { EditModulesModal } from '../'
import { PDAlert } from '../../../alerts/PDAlert'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as featureSelectors } from '../../../../feature-flags'
import * as stepFormActions from '../../../../step-forms/actions'
import * as labwareModuleCompatibility from '../../../../utils/labwareModuleCompatibility'
import * as labwareIngredActions from '../../../../labware-ingred/actions'
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

    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
      labware: {},
      modules: {},
      pipettes: {},
    })
    featureSelectors.getDisableModuleRestrictions = jest
      .fn()
      .mockReturnValue(true)
  })

  test('displays warning and disabled save button when slot is occupied by incompatible labware', () => {
    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
      labware: {
        well: {
          slot: '1',
        },
      },
      modules: {},
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible = jest
      .fn()
      .mockReturnValue(false)
    const props = {
      moduleType: 'magdeck',
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: '1' } })
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(1)
    expect(saveButton.prop('disabled')).toBe(true)
  })

  test('save button is clickable and saves when slot is occupied by compatible labware', () => {
    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
      labware: {
        well: {
          slot: '1',
        },
      },
      modules: {},
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible = jest
      .fn()
      .mockReturnValue(true)
    const props = {
      moduleType: 'magdeck',
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: '1' } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot: '1',
      type: 'magdeck',
      model: 'GEN1',
    })
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  test('save button saves when slot is empty', () => {
    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
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
      moduleType: 'tempdeck',
      moduleId: null,
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: '10' } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(stepFormActions.createModule).toHaveBeenCalledWith({
      slot: '10',
      type: 'tempdeck',
      model: 'GEN1',
    })
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  test('move deck item when moving module to a different slot', () => {
    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
      labware: {
        well: {
          slot: '1',
        },
      },
      modules: {
        magnet123: {
          slot: '1',
        },
      },
      pipettes: {},
    })
    labwareModuleCompatibility.getLabwareIsCompatible = jest
      .fn()
      .mockReturnValue(true)
    const props = {
      moduleType: 'magdeck',
      moduleId: 'magnet123',
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const saveButton = wrapper.find(OutlineButton).at(1)
    const slotDropdown = wrapper.find('.option_slot select')
    slotDropdown.simulate('change', { target: { value: '10' } })
    saveButton.simulate('click')
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
    expect(labwareIngredActions.moveDeckItem).toHaveBeenCalledWith('1', '10')
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  test('no warning when slot is occupied by same module', () => {
    stepFormSelectors.getInitialDeckSetup = jest.fn().mockReturnValue({
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
      moduleType: 'magdeck',
      moduleId: 'magnet123',
      onCloseClick: jest.fn(),
    }

    const wrapper = render(props)
    const warning = wrapper.find(PDAlert)

    expect(warning).toHaveLength(0)
  })

  test('cancel calls onCloseClick to close modal', () => {
    const props = {
      moduleType: 'magdeck',
      moduleId: null,
      onCloseClick: jest.fn(),
    }
    const wrapper = render(props)

    const cancelButton = wrapper.find(OutlineButton).at(0)
    cancelButton.simulate('click')
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
