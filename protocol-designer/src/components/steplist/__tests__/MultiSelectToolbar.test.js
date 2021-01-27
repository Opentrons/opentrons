// @flow
import React from 'react'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'
import { act } from 'react-dom/test-utils'

import { actions as stepActions } from '../../../ui/steps'
import * as stepFormSelectors from '../../../step-forms/selectors'
import * as stepSelectors from '../../../ui/steps/selectors'

import { MultiSelectToolbar, ClickableIcon } from '../MultiSelectToolbar'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../ui/steps/selectors')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getOrderedStepIdsMock = stepFormSelectors.getOrderedStepIds
const getMultiSelectItemIdsMock = stepSelectors.getMultiSelectItemIds

describe('MultiSelectToolbar', () => {
  let store
  beforeEach(() => {
    store = mockStore()
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue([])
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })
  const render = () =>
    mount(
      <Provider store={store}>
        <MultiSelectToolbar />
      </Provider>
    )

  it('should render the delete, copy, and exapand icons with the correct tooltips', () => {
    const wrapper = render()
    const icons = wrapper.find(ClickableIcon)
    const deleteIcon = icons.at(1)
    const copyIcon = icons.at(2)
    const expandIcon = icons.at(3)

    expect(deleteIcon.prop('iconName')).toBe('delete')
    expect(deleteIcon.prop('tooltipText')).toBe('delete')

    expect(copyIcon.prop('iconName')).toBe('content-copy')
    expect(copyIcon.prop('tooltipText')).toBe('duplicate')

    expect(expandIcon.prop('iconName')).toBe('unfold-more-horizontal')
    expect(expandIcon.prop('tooltipText')).toBe('expand')
  })
  it('should have a checked checkbox when all steps are selected, and deselect them all when clicked', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    const deselectAllStepsSpy = jest
      .spyOn(stepActions, 'deselectAllSteps')
      .mockImplementation(() => () => null) // mockImplementation is just to avoid calling the real action creator

    const wrapper = render()
    const selectIcon = wrapper.find(ClickableIcon).first()
    expect(selectIcon.prop('iconName')).toBe('checkbox-marked')
    act(() => {
      selectIcon.prop('onClick')()
    })
    expect(deselectAllStepsSpy).toHaveBeenCalled()
  })

  it('should have a minus box when not all steps are selected, and select them all when clicked', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1'])

    const selectAllStepsSpy = jest.spyOn(stepActions, 'selectAllSteps')
    const wrapper = render()
    const selectIcon = wrapper.find(ClickableIcon).first()
    expect(selectIcon.prop('iconName')).toBe('minus-box')
    act(() => {
      selectIcon.prop('onClick')()
    })
    expect(selectAllStepsSpy).toHaveBeenCalled()
  })
  describe('when clicking on expand/collapse', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })
    it('should toggle the collapsed state of the selected steps ', () => {
      when(getMultiSelectItemIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1', 'id_2'])

      const toggleMultipleStepsCollapsedSpy = jest.spyOn(
        stepActions,
        'toggleMultipleStepsCollapsed'
      )
      const wrapper = render()
      const expandIcon = wrapper.find(ClickableIcon).at(3)
      act(() => {
        expandIcon.prop('onClick')()
      })
      expect(toggleMultipleStepsCollapsedSpy).toHaveBeenCalledWith([
        'id_1',
        'id_2',
      ])
    })
    it('should toggle the expand/collapse icon', () => {
      const wrapper = render()
      const expandIcon = wrapper.find(ClickableIcon).at(3)
      expect(expandIcon.prop('iconName')).toBe('unfold-more-horizontal')
      expect(expandIcon.prop('tooltipText')).toBe('expand')
      act(() => {
        expandIcon.prop('onClick')()
      })
      wrapper.update()
      const expandIconUpdated = wrapper.find(ClickableIcon).at(3)
      expect(expandIconUpdated.prop('iconName')).toBe('unfold-less-horizontal')
      expect(expandIconUpdated.prop('tooltipText')).toBe('collapse')
    })
  })
})
