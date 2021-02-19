// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { act } from 'react-dom/test-utils'
import { when, resetAllWhenMocks } from 'jest-when'
import * as stepFormSelectors from '../../../step-forms/selectors'
import { actions as stepActions } from '../../../ui/steps'
import { getMultiSelectItemIds } from '../../../ui/steps/selectors'
import { ConfirmDeleteModal } from '../../modals/ConfirmDeleteModal'
import { ExitBatchEditButton } from '../StepSelectionBannerComponent'
import { StepSelectionBanner } from '..'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../ui/steps/selectors')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getBatchEditFormHasUnsavedChangesMock =
  stepFormSelectors.getBatchEditFormHasUnsavedChanges
const getSavedStepFormsMock = stepFormSelectors.getSavedStepForms
const getMultiSelectItemIdsMock = getMultiSelectItemIds

describe('StepSelectionBanner', () => {
  let store
  beforeEach(() => {
    store = mockStore()
    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(getSavedStepFormsMock)
      .calledWith(expect.anything())
      .mockReturnValue({})
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  const render = (store, props) =>
    mount(<StepSelectionBanner {...props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: {
        store: store,
      },
    })

  describe('when clicking "exit batch edit"', () => {
    it('should exit batch edit mode when there are NOT unsaved form changes', () => {
      when(getBatchEditFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(false)

      const deselectAllStepsSpy = jest
        .spyOn(stepActions, 'deselectAllSteps')
        .mockImplementation(() => () => null)

      const props = { countPerStepType: { magnet: 1 } }
      const wrapper = render(store, props)
      expect(deselectAllStepsSpy).not.toHaveBeenCalled()
      act(() => {
        wrapper.find(ExitBatchEditButton).prop('handleExitBatchEdit')()
      })
      expect(deselectAllStepsSpy).toHaveBeenCalled()
    })
    it('should render a confirmation modal when there are unsaved form changes', () => {
      when(getBatchEditFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)

      const deselectAllStepsSpy = jest
        .spyOn(stepActions, 'deselectAllSteps')
        .mockImplementation(() => () => null)
      expect(deselectAllStepsSpy).not.toHaveBeenCalled()

      const props = { countPerStepType: { magnet: 1 } }
      const wrapper = render(store, props)
      expect(wrapper.find(ConfirmDeleteModal).length).toBe(0)
      expect(deselectAllStepsSpy).not.toHaveBeenCalled()

      act(() => {
        wrapper.find(ExitBatchEditButton).prop('handleExitBatchEdit')()
      })
      wrapper.update()

      expect(deselectAllStepsSpy).not.toHaveBeenCalled()
      const confirmModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmModal.length).toBe(1)
    })
  })
})
