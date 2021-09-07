import * as React from 'react'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { act } from 'react-dom/test-utils'
import { when, resetAllWhenMocks } from 'jest-when'
import * as stepFormSelectors from '../../../step-forms/selectors'
import { actions as stepActions } from '../../../ui/steps'
import { getCountPerStepType } from '../../../ui/steps/selectors'
import { ConfirmDeleteModal } from '../../modals/ConfirmDeleteModal'
import { ExitBatchEditButton } from '../StepSelectionBannerComponent'
import { StepSelectionBanner } from '..'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../ui/steps/selectors')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getBatchEditFormHasUnsavedChangesMock = stepFormSelectors.getBatchEditFormHasUnsavedChanges as jest.MockedFunction<
  typeof stepFormSelectors.getBatchEditFormHasUnsavedChanges
>
const getCountPerStepTypeMock: jest.MockedFunction<any> = getCountPerStepType

describe('StepSelectionBanner', () => {
  let store: any
  beforeEach(() => {
    store = mockStore()
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  const render = (store: any) =>
    mount(<StepSelectionBanner />, {
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

      const countPerStepType = { magnet: 1 }
      when(getCountPerStepTypeMock)
        .calledWith(expect.anything())
        .mockReturnValue(countPerStepType)

      const wrapper = render(store)
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

      const countPerStepType = { magnet: 1 }
      when(getCountPerStepTypeMock)
        .calledWith(expect.anything())
        .mockReturnValue(countPerStepType)

      const wrapper = render(store)
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
