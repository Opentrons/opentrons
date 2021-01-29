// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'

import * as stepFormSelectors from '../../../step-forms/selectors'
import * as stepSelectors from '../../../ui/steps'

import { MultiSelectToolbar, ClickableIcon } from '../MultiSelectToolbar'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../ui/steps')

const mockStore = configureMockStore()
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

    expect(expandIcon.prop('iconName')).toBe('unfold-less-horizontal')
    expect(expandIcon.prop('tooltipText')).toBe('collapse')
  })
  it('should have a checked checkbox when all steps are selected', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    const wrapper = render()
    expect(wrapper.find(ClickableIcon).first().prop('iconName')).toBe(
      'checkbox-marked'
    )
  })

  it('should have a minus box when all steps are not selected', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1'])

    const wrapper = render()
    expect(wrapper.find(ClickableIcon).first().prop('iconName')).toBe(
      'minus-box'
    )
  })
})
