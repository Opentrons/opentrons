import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import {
  HoverTooltip,
  SlotMap,
  LabeledValue,
  OutlineButton,
} from '@opentrons/components'
import { DEFAULT_MODEL_FOR_MODULE_TYPE } from '../../../constants'
import { actions as stepFormActions } from '../../../step-forms'
import { ModuleRow } from '../ModuleRow'
import { ModuleDiagram } from '../ModuleDiagram'

describe('ModuleRow', () => {
  let store, magneticModule
  beforeEach(() => {
    magneticModule = {
      id: 'magnet123',
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
      slot: '1',
    }

    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })

  function render(renderProps) {
    return mount(
      <Provider store={store}>
        <ModuleRow {...renderProps} />
      </Provider>
    )
  }

  it('displays crash warning tooltip when module is crashable and in slot 1', () => {
    const props = {
      module: magneticModule,
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(HoverTooltip).prop('tooltipComponent')).toBeTruthy()
    expect(wrapper.find(SlotMap).prop('collisionSlots')).toEqual(['4'])
  })

  it('displays crash warning tooltip when module is crashable and in slot 3', () => {
    magneticModule.slot = '3'
    const props = {
      module: magneticModule,
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(HoverTooltip).prop('tooltipComponent')).toBeTruthy()
    expect(wrapper.find(SlotMap).prop('collisionSlots')).toEqual(['6'])
  })

  it('does not display crash warning tooltip when module is not crashable regardless of slot', () => {
    magneticModule.model = MAGNETIC_MODULE_V2
    const props = {
      module: magneticModule,
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(HoverTooltip).prop('tooltipComponent')).toBeNull()
    expect(wrapper.find(SlotMap).prop('collisionSlots')).toHaveLength(0)
  })

  it('does not display warning tooltip when showCollisionWarnings is false', () => {
    const props = {
      module: magneticModule,
      showCollisionWarnings: false,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(HoverTooltip).prop('tooltipComponent')).toBeNull()
    expect(wrapper.find(SlotMap).prop('collisionSlots')).toHaveLength(0)
  })

  it('displays the default module diagram when module has not been added', () => {
    const props = {
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }
    const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[MAGNETIC_MODULE_TYPE]

    const wrapper = render(props)

    expect(wrapper.find(ModuleDiagram).prop('model')).toEqual(defaultModel)
  })

  it('displays the correct module diagram for the selected module model', () => {
    magneticModule.model = MAGNETIC_MODULE_V2
    const props = {
      module: magneticModule,
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(ModuleDiagram).prop('model')).toEqual(
      MAGNETIC_MODULE_V2
    )
  })

  it('displays the correct module model and slot when it is added to protocol', () => {
    const props = {
      module: magneticModule,
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(
      wrapper
        .find(LabeledValue)
        .filter({ label: 'Model' })
        .prop('value')
    ).toBe('GEN1')
    expect(
      wrapper
        .find(LabeledValue)
        .filter({ label: 'Position' })
        .prop('value')
    ).toBe('Slot 1')
  })

  it('does not display module model and slot when module has not been added to protocol', () => {
    const props = {
      showCollisionWarnings: true,
      type: MAGNETIC_MODULE_TYPE,
      openEditModuleModal: jest.fn(),
    }

    const wrapper = render(props)

    expect(wrapper.find(LabeledValue)).toHaveLength(0)
  })

  describe('buttons', () => {
    it('opens edit modal when module is added', () => {
      const props = {
        module: magneticModule,
        showCollisionWarnings: true,
        type: MAGNETIC_MODULE_TYPE,
        openEditModuleModal: jest.fn(),
      }

      const wrapper = render(props)
      const editButton = wrapper
        .find(OutlineButton)
        .filterWhere(n => n.text() === 'Edit')
      editButton.simulate('click')

      expect(props.openEditModuleModal).toHaveBeenCalledWith(
        MAGNETIC_MODULE_TYPE,
        'magnet123'
      )
    })

    it('adds module when module has not been added yet', () => {
      const props = {
        showCollisionWarnings: true,
        type: MAGNETIC_MODULE_TYPE,
        openEditModuleModal: jest.fn(),
      }

      const wrapper = render(props)
      const editButton = wrapper
        .find(OutlineButton)
        .filterWhere(n => n.text() === 'add')
      editButton.simulate('click')

      expect(props.openEditModuleModal).toHaveBeenCalledWith(
        MAGNETIC_MODULE_TYPE,
        undefined
      )
    })

    it('removes module when module has been added', () => {
      const props = {
        module: magneticModule,
        showCollisionWarnings: true,
        type: MAGNETIC_MODULE_TYPE,
        openEditModuleModal: jest.fn(),
      }

      const wrapper = render(props)
      const editButton = wrapper
        .find(OutlineButton)
        .filterWhere(n => n.text() === 'remove')
      editButton.simulate('click')

      expect(store.dispatch).toHaveBeenCalledWith(
        stepFormActions.deleteModule('magnet123')
      )
    })
  })
})
