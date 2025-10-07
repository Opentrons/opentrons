import { legacy_configureStore } from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getOrderedStepIds } from '../../step-forms/selectors'
import { deleteMultipleSteps } from '../actions/actions'

vi.mock('../../step-forms/selectors')

const mockStore = legacy_configureStore([thunk] as any)
describe('step list actions', () => {
  describe('deleteMultipleSteps', () => {
    let store: any
    beforeEach(() => {
      store = mockStore()
      when(vi.mocked(getOrderedStepIds))
        .calledWith(expect.anything())
        .thenReturn([])
    })

    afterEach(() => {
      vi.resetAllMocks()
    })
    describe('when not deleting all steps', () => {
      it('should select the remaining steps', () => {
        const allSteps = ['1', '2', '3', '4', '5']
        const stepsToDelete = ['1', '2']

        when(vi.mocked(getOrderedStepIds))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['1', '2'],
        }

        const selectMultipleStepsAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: { stepIds: ['3'], lastSelected: '3' },
        }
        const actions = store.getActions()
        expect(actions).toEqual([
          deleteMultipleStepsAction,
          selectMultipleStepsAction,
        ])
      })
      it('should select the remaining steps even when given in a nonlinear order', () => {
        const allSteps = ['1', '2', '3', '4', '5']
        const stepsToDelete = ['4', '1']

        when(vi.mocked(getOrderedStepIds))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['4', '1'],
        }

        const selectMultipleStepsAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: { stepIds: ['5'], lastSelected: '5' },
        }
        const actions = store.getActions()
        expect(actions).toEqual([
          deleteMultipleStepsAction,
          selectMultipleStepsAction,
        ])
      })
      it('should select the last non terminal item that is not deleted', () => {
        const allSteps = ['1', '2', '3', '4', '5']
        const stepsToDelete = ['4', '5']

        when(vi.mocked(getOrderedStepIds))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['4', '5'],
        }

        const selectMultipleStepsAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: { stepIds: ['3'], lastSelected: '3' },
        }
        const actions = store.getActions()
        expect(actions).toEqual([
          deleteMultipleStepsAction,
          selectMultipleStepsAction,
        ])
      })
      it('should select the last non terminal item that is not deleted even when given a non linear order', () => {
        const allSteps = ['1', '2', '3', '4', '5']
        const stepsToDelete = ['5', '4', '1']

        when(vi.mocked(getOrderedStepIds))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['5', '4', '1'],
        }

        const selectMultipleStepsAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: { stepIds: ['3'], lastSelected: '3' },
        }
        const actions = store.getActions()
        expect(actions).toEqual([
          deleteMultipleStepsAction,
          selectMultipleStepsAction,
        ])
      })
    })
    describe('when deleting all steps', () => {
      it('should delete all of the steps and clear the selected item', () => {
        const allSteps = ['1', '2', '3', '4', '5']
        const stepsToDelete = [...allSteps]

        when(vi.mocked(getOrderedStepIds))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: allSteps,
        }

        const clearSelectedItemAction = {
          type: 'CLEAR_SELECTED_ITEM',
        }
        const actions = store.getActions()
        expect(actions).toEqual([
          deleteMultipleStepsAction,
          clearSelectedItemAction,
        ])
      })
    })
  })
})
