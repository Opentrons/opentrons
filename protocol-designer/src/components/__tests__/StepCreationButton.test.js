// @flow
import React from 'react'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'

import { getIsMultiSelectMode } from '../../ui/steps'
import * as stepFormSelectors from '../../step-forms/selectors'

import { PrimaryButton } from '@opentrons/components'
import { StepCreationButton } from '../StepCreationButton'

jest.mock('../../step-forms/selectors')
jest.mock('../../ui/steps/selectors')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved
const getCurrentFormHasUnsavedChangesMock =
  stepFormSelectors.getCurrentFormHasUnsavedChanges
const getInitialDeckSetupMock = stepFormSelectors.getInitialDeckSetup
const getIsMultiSelectModeMock = getIsMultiSelectMode

describe('StepCreationButton', () => {
  let store
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
    const button = wrapper.find(PrimaryButton)
    expect(button.prop('disabled')).toBe(false)
  })

  it('should be DISABLED when in MULTI select mode', () => {
    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(true)

    const wrapper = render()
    const button = wrapper.find(PrimaryButton)
    expect(button.prop('disabled')).toBe(true)
  })

  // TODO (ka 2021-2-10): Add comprehensive tests for StepCreationButton
})
