import { legacy_configureStore } from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getSavedStepHierarchy } from '../../step-forms/selectors'
import { deleteMultipleSteps } from '../actions/actions'

import type { StepHierarchy } from '../utils/stepHierarchy'

vi.mock('../../step-forms/selectors')

const mockStore = legacy_configureStore([thunk] as any)
describe('step list actions', () => {
  describe('deleteMultipleSteps', () => {
    let store: any
    beforeEach(() => {
      store = mockStore()
      when(vi.mocked(getSavedStepHierarchy))
        .calledWith(expect.anything())
        .thenReturn({ topLevelItems: [] })
    })

    afterEach(() => {
      vi.resetAllMocks()
    })
    describe('when not deleting all steps', () => {
      it('should select the remaining steps', () => {
        const allSteps: StepHierarchy = {
          topLevelItems: ['1', '2', '3', '4', '5'].map(id => ({
            type: 'standaloneStep',
            stepId: id,
          })),
        }

        const stepsToDelete = ['1', '2']

        when(vi.mocked(getSavedStepHierarchy))
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
        const allSteps: StepHierarchy = {
          topLevelItems: ['1', '2', '3', '4', '5'].map(id => ({
            type: 'standaloneStep',
            stepId: id,
          })),
        }
        const stepsToDelete = ['4', '1']

        when(vi.mocked(getSavedStepHierarchy))
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
        const allSteps: StepHierarchy = {
          topLevelItems: ['1', '2', '3', '4', '5'].map(id => ({
            type: 'standaloneStep',
            stepId: id,
          })),
        }
        const stepsToDelete = ['4', '5']

        when(vi.mocked(getSavedStepHierarchy))
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
        const allSteps: StepHierarchy = {
          topLevelItems: ['1', '2', '3', '4', '5'].map(id => ({
            type: 'standaloneStep',
            stepId: id,
          })),
        }
        const stepsToDelete = ['5', '4', '1']

        when(vi.mocked(getSavedStepHierarchy))
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

      it('should automatically delete the end step of a Thermocycler profile group', () => {
        const allSteps: StepHierarchy = {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: '2',
              concurrentSteps: [{ type: 'standaloneStep', stepId: '3' }],
              waitStepId: '4',
            },
            { type: 'standaloneStep', stepId: '5' },
          ],
        }
        const stepsToDelete = ['2']

        when(vi.mocked(getSavedStepHierarchy))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['2', '4'],
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
    })
    describe('when deleting all steps', () => {
      it('should delete all of the steps and clear the selected item', () => {
        const allSteps: StepHierarchy = {
          topLevelItems: ['1', '2', '3', '4', '5'].map(id => ({
            type: 'standaloneStep',
            stepId: id,
          })),
        }
        const stepsToDelete = ['1', '2', '3', '4', '5']

        when(vi.mocked(getSavedStepHierarchy))
          .calledWith(expect.anything())
          .thenReturn(allSteps)

        store.dispatch(deleteMultipleSteps(stepsToDelete))
        const deleteMultipleStepsAction = {
          type: 'DELETE_MULTIPLE_STEPS',
          payload: ['1', '2', '3', '4', '5'],
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
