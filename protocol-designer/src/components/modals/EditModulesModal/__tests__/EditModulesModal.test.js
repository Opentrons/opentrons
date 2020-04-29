// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import * as Formik from 'formik'
import { OutlineButton } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import {
  getMockDeckSetup,
  getMockMagneticModule,
  getMockTemperatureModule,
} from '../../../../../fixtures/state/deck'
import {
  actions as stepFormActions,
  selectors as stepFormSelectors,
} from '../../../../step-forms'
import {
  getLabwareOnSlot,
  getSlotsBlockedBySpanning,
  getSlotIsEmpty,
} from '../../../../step-forms/utils'
import * as moduleData from '../../../../modules/moduleData'
import { MODELS_FOR_MODULE_TYPE } from '../../../../constants'
import { selectors as featureSelectors } from '../../../../feature-flags'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import { isModuleWithCollisionIssue } from '../../../modules/utils'
import { PDAlert } from '../../../alerts/PDAlert'
import { EditModulesModal } from '..'
import { ModelDropdown } from '../ModelDropdown'
import { SlotDropdown } from '../SlotDropdown'

jest.mock('../../../../utils/labwareModuleCompatibility')
jest.mock('../../../../feature-flags')
jest.mock('../../../../step-forms/selectors')
jest.mock('../../../modules/utils')
jest.mock('../../../../step-forms/utils')
jest.mock('../form-state')

const MODEL_FIELD = 'selectedModel'
const SLOT_FIELD = 'selectedSlot'

const getInitialDeckSetupMock: JestMockFn<any, any> =
  stepFormSelectors.getInitialDeckSetup

const getLabwareIsCompatibleMock: JestMockFn<any, any> = getLabwareIsCompatible

const getDisableModuleRestrictionsMock: JestMockFn<any, any> =
  featureSelectors.getDisableModuleRestrictions

const isModuleWithCollisionIssueMock: JestMockFn<
  any,
  any
> = isModuleWithCollisionIssue

const getSlotsBlockedBySpanningMock: JestMockFn<
  any,
  any
> = getSlotsBlockedBySpanning

const getSlotIsEmptyMock: JestMockFn<any, any> = getSlotIsEmpty

const getLabwareOnSlotMock: JestMockFn<any, any> = getLabwareOnSlot

describe('Edit Modules Modal', () => {
  let mockStore
  let props
  beforeEach(() => {
    getInitialDeckSetupMock.mockReturnValue(getMockDeckSetup())
    getSlotsBlockedBySpanningMock.mockReturnValue([])
    getLabwareOnSlotMock.mockReturnValue({})
    props = {
      moduleOnDeck: null,
      moduleType: MAGNETIC_MODULE_TYPE,
      onCloseClick: jest.fn(),
      editModuleModel: jest.fn(),
      editModuleSlot: jest.fn(),
      displayModuleWarning: jest.fn(),
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
  const render = props =>
    mount(
      <Provider store={mockStore}>
        <EditModulesModal {...props} />
      </Provider>
    )

  describe('PD alert', () => {
    beforeEach(() => {
      getDisableModuleRestrictionsMock.mockReturnValue(false)
    })
    afterEach(() => {
      jest.clearAllMocks()
    })
    it('does NOT render when labware is compatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(true)
      const wrapper = render(props)
      expect(wrapper.find(PDAlert)).toHaveLength(0)
    })

    it('renders when labware is incompatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(false)
      const wrapper = render(props)
      expect(wrapper.find(PDAlert)).toHaveLength(1)
    })
  })

  describe('Slot Dropdown', () => {
    it('should pass the correct options', () => {
      const mockSlots = [{ value: 'mockSlots', name: 'mockSlots' }]
      jest
        .spyOn(moduleData, 'getAllModuleSlotsByType')
        .mockImplementation(() => mockSlots)

      const wrapper = render(props)
      expect(wrapper.find(SlotDropdown).prop('options')).toBe(mockSlots)
    })
    it('should be enabled when there is no collision issue', () => {
      props.moduleOnDeck = getMockMagneticModule()
      isModuleWithCollisionIssueMock.mockReturnValueOnce(false)
      const wrapper = render(props)
      expect(wrapper.find(SlotDropdown).prop('disabled')).toBe(false)
    })

    it('should be disabled when there is no collision issue', () => {
      isModuleWithCollisionIssueMock.mockReturnValue(true)
      const wrapper = render(props)
      expect(wrapper.find(SlotDropdown).prop('disabled')).toBe(true)
    })

    it('should error when labware is incompatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(false)
      const wrapper = render(props)
      expect(
        wrapper
          .find(SlotDropdown)
          .childAt(0)
          .prop('error')
      ).toMatch('labware incompatible')
    })

    it('should error when slot is empty but blocked', () => {
      getSlotIsEmptyMock.mockReturnValueOnce(true)
      getSlotsBlockedBySpanningMock.mockReturnValue(['1']) // 1 is default slot
      const wrapper = render(props)
      expect(
        wrapper
          .find(SlotDropdown)
          .childAt(0)
          .prop('error')
      ).toMatch('labware incompatible')
    })
    it('should NOT error when labware is compatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(true)
      const wrapper = render(props)
      expect(
        wrapper
          .find(SlotDropdown)
          .childAt(0)
          .prop('error')
      ).toBeFalsy()
    })
  })

  describe('Model Dropdown', () => {
    it('should pass the correct props for magnetic module', () => {
      props.moduleType = MAGNETIC_MODULE_TYPE
      const wrapper = render(props)
      const expectedProps = {
        fieldName: MODEL_FIELD,
        options: MODELS_FOR_MODULE_TYPE[MAGNETIC_MODULE_TYPE],
        tabIndex: 0,
      }
      expect(wrapper.find(ModelDropdown).props()).toEqual(expectedProps)
    })
    it('should pass the correct props for temperature module', () => {
      props.moduleType = TEMPERATURE_MODULE_TYPE
      const wrapper = render(props)
      const expectedProps = {
        fieldName: MODEL_FIELD,
        options: MODELS_FOR_MODULE_TYPE[TEMPERATURE_MODULE_TYPE],
        tabIndex: 0,
      }
      expect(wrapper.find(ModelDropdown).props()).toEqual(expectedProps)
    })
  })

  describe('Cancel Button', () => {
    it('calls onCloseClick when pressed', () => {
      const wrapper = render(props)
      wrapper
        .find(OutlineButton)
        .at(0)
        .prop('onClick')()
      expect(props.onCloseClick).toHaveBeenCalled()
    })
  })
  describe('Form Submission', () => {
    it('sets module change warning info when model has changed and is magnetic module', () => {
      props.moduleOnDeck = getMockMagneticModule()
      const wrapper = render(props)
      const formik = wrapper.find(Formik.Formik)
      const mockValues = {
        selectedSlot: '1',
        selectedModel: MAGNETIC_MODULE_V2,
      }
      act(() => {
        formik.invoke('onSubmit')(mockValues)
      })
      expect(props.displayModuleWarning).toHaveBeenCalledWith({
        model: mockValues.selectedModel,
        slot: mockValues.selectedSlot,
      })
    })

    it('edits the model and slot if module is not magnetic module', () => {
      props.moduleOnDeck = getMockTemperatureModule()
      const wrapper = render(props)
      const formik = wrapper.find(Formik.Formik)
      const mockValues = {
        selectedSlot: '1',
        selectedModel: TEMPERATURE_MODULE_V2,
      }
      act(() => {
        formik.invoke('onSubmit')(mockValues)
      })
      expect(props.editModuleModel).toHaveBeenCalledWith(TEMPERATURE_MODULE_V2)
      expect(props.editModuleSlot).toHaveBeenCalledWith('1')
    })

    it('creates a new module if no module is registered', () => {
      props.moduleOnDeck = null
      const wrapper = render(props)
      const formik = wrapper.find(Formik.Formik)
      const mockValues = {
        selectedSlot: '1',
        selectedModel: MAGNETIC_MODULE_V2,
      }
      act(() => {
        formik.invoke('onSubmit')(mockValues)
      })

      const params = {
        slot: '1',
        type: MAGNETIC_MODULE_TYPE,
        model: MAGNETIC_MODULE_V2,
      }

      const createModuleAction = stepFormActions.createModule(params)

      const expected = {
        ...createModuleAction,
        payload: {
          ...createModuleAction.payload,
          id: expect.stringContaining(MAGNETIC_MODULE_TYPE), // need to do this because exact id is created on the fly
        },
      }

      expect(mockStore.dispatch).toHaveBeenCalledWith(expected)
    })
  })
})
