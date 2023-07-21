import React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-dom/test-utils'
import thunk from 'redux-thunk'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'

import * as stepFormSelectors from '../../step-forms/selectors'
import { actions as stepsActions, getIsMultiSelectMode } from '../../ui/steps'

import { DeprecatedPrimaryButton, Tooltip } from '@opentrons/components'
import {
  StepCreationButton,
  StepCreationButtonComponent,
  StepButtonItem,
} from '../StepCreationButton'

jest.mock('../../step-forms/selectors')
jest.mock('../../ui/steps/selectors')
jest.mock('../../feature-flags')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved
const getCurrentFormHasUnsavedChangesMock =
  stepFormSelectors.getCurrentFormHasUnsavedChanges
const getInitialDeckSetupMock = stepFormSelectors.getInitialDeckSetup
const getIsMultiSelectModeMock = getIsMultiSelectMode
describe('StepCreationButton', () => {
  let store: any

  beforeEach(() => {
    store = mockStore()

    when(getCurrentFormIsPresavedMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getCurrentFormHasUnsavedChangesMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getInitialDeckSetupMock)
      .calledWith(expect.anything())
      .mockReturnValue({
        labware: {},
        pipettes: {},
        modules: {},
      })

    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  const render = () =>
    mount(
      <Provider store={store}>
        <StepCreationButton />
      </Provider>
    )

  it('should be ENABLED when in SINGLE select mode', () => {
    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    const wrapper = render()
    const button = wrapper.find(DeprecatedPrimaryButton)
    expect(button.prop('disabled')).toBe(false)
  })

  it('should be DISABLED when in MULTI select mode', () => {
    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(true)

    const wrapper = render()
    const button = wrapper.find(DeprecatedPrimaryButton)
    expect(button.prop('disabled')).toBe(true)
  })

  describe('when clicking add step', () => {
    it('expands StepCreationButtonComponent onClick', () => {
      const wrapper = render()
      const button = wrapper.find(DeprecatedPrimaryButton)
      const initAddStepButton = wrapper.find(StepCreationButtonComponent)
      // component starts off !expanded until click
      expect(initAddStepButton.prop('expanded')).toBe(false)

      act(() => {
        button.simulate('click')
      })

      wrapper.update()
      // expanded prop now set to true
      expect(wrapper.find(StepCreationButtonComponent).prop('expanded')).toBe(
        true
      )
    })

    it('renders step button items when expanded', () => {
      const wrapper = render()
      const button = wrapper.find(DeprecatedPrimaryButton)
      act(() => {
        button.simulate('click')
      })
      wrapper.update()
      const updatedAddStepButton = wrapper.find(StepCreationButtonComponent)
      // all 8 step button items render as children
      const stepButtonItems = updatedAddStepButton.find(StepButtonItem)
      //  length 4 since there are no modules on deck
      expect(stepButtonItems).toHaveLength(4)
      // enabled button tooltip
      const mixTooltip = stepButtonItems.at(2).find(Tooltip)
      expect(mixTooltip.prop('children')).toBe('Mix contents of wells/tubes.')
    })

    it('enables module step types when present on the deck', () => {
      when(getInitialDeckSetupMock)
        .calledWith(expect.anything())
        .mockReturnValue({
          labware: {},
          pipettes: {},
          modules: {
            abcdef: {
              id: 'abcdef',
              model: TEMPERATURE_MODULE_V1,
              type: TEMPERATURE_MODULE_TYPE,
              slot: '3',
            } as any,
          },
        })
      const wrapper = render()
      const button = wrapper.find(DeprecatedPrimaryButton)

      act(() => {
        button.simulate('click')
      })
      wrapper.update()
      const updatedAddStepButton = wrapper.find(StepCreationButtonComponent)
      const stepButtonItems = updatedAddStepButton.find(StepButtonItem)
      //  length 5 since there is a temperature module on deck
      expect(stepButtonItems).toHaveLength(5)
      // enabled temperature module step tooltip
      const enabledButtonTooltip = stepButtonItems.at(4).find(Tooltip)
      expect(enabledButtonTooltip.prop('children')).toBe(
        'Set temperature command for Temperature module.'
      )
    })
  })
  describe('StepButtonItem', () => {
    it('should dispatch add step action onClick', () => {
      const addStepSpy = jest
        .spyOn(stepsActions, 'addAndSelectStepWithHints')
        .mockImplementation(() => () => null) // mockImplementation is just to avoid calling the real action creator

      const wrapper = render()
      const button = wrapper.find(DeprecatedPrimaryButton)

      act(() => {
        button.simulate('click')
      })
      wrapper.update()

      const stepButtonItem = wrapper.find(StepButtonItem).first()
      act(() => {
        stepButtonItem.prop('onClick')()
      })
      expect(addStepSpy).toHaveBeenCalled()
    })
  })
})
