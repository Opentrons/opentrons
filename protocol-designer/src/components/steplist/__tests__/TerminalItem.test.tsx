// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { when, resetAllWhenMocks } from 'jest-when'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import * as stepFormSelectors from '../../../step-forms/selectors/index.js'
import * as uiStepSelectors from '../../../ui/steps/selectors.js'
import {
  ConfirmDeleteModal,
  CLOSE_UNSAVED_STEP_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
} from '../../../components/modals/ConfirmDeleteModal'
import { PDTitledList } from '../../lists'
import { TerminalItem, TerminalItemProps } from '../TerminalItem'

jest.mock('../../../step-forms/selectors/index.js')
jest.mock('../../../ui/steps/selectors.js')

const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved as jest.MockedFunction<
  typeof stepFormSelectors.getCurrentFormIsPresaved
>
const getCurrentFormHasUnsavedChangesMock = stepFormSelectors.getCurrentFormHasUnsavedChanges as jest.MockedFunction<
  typeof stepFormSelectors.getCurrentFormHasUnsavedChanges
>
const getIsMultiSelectModeMock = uiStepSelectors.getIsMultiSelectMode as jest.MockedFunction<
  typeof uiStepSelectors.getIsMultiSelectMode
>

const mockStore = configureMockStore([thunk])

describe('TerminalItem', () => {
  let store: any
  let props: TerminalItemProps
  beforeEach(() => {
    props = {
      id: '__initial_setup__',
      title: '',
    }
    store = mockStore()

    when(getCurrentFormIsPresavedMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getCurrentFormHasUnsavedChangesMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  const render = (props: React.ComponentProps<typeof TerminalItem>) =>
    mount(
      <Provider store={store}>
        <TerminalItem {...props} />
      </Provider>
    )

  describe('when clicked', () => {
    it('should display the "close unsaved form" modal when form has not yet been saved', () => {
      when(getCurrentFormIsPresavedMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): onClick handler might be undefined
        wrapper.find(PDTitledList).prop('onClick')()
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(1)
      expect(confirmDeleteModal.prop('modalType')).toBe(CLOSE_UNSAVED_STEP_FORM)
      expect(store.getActions().length).toBe(0)
    })
    it('should display the "unsaved changes to step" modal when single edit form has unsaved changes', () => {
      when(getCurrentFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): onClick handler might be undefined
        wrapper.find(PDTitledList).prop('onClick')()
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(1)
      expect(confirmDeleteModal.prop('modalType')).toBe(
        CLOSE_STEP_FORM_WITH_CHANGES
      )
      expect(store.getActions().length).toBe(0)
    })
    it('should not do anything when in multi select mode', () => {
      when(getIsMultiSelectModeMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): onClick handler might be undefined
        wrapper.find(PDTitledList).prop('onClick')()
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(0)
    })
  })
})
