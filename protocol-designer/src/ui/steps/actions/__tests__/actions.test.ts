import last from 'lodash/last'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { when, resetAllWhenMocks } from 'jest-when'
import * as utils from '../../../../utils'
import * as stepFormSelectors from '../../../../step-forms/selectors'
import { getMultiSelectLastSelected } from '../../selectors'
import { selectStep, selectAllSteps, deselectAllSteps } from '../actions'
import { duplicateStep, duplicateMultipleSteps } from '../thunks'
jest.mock('../../../../step-forms/selectors')
jest.mock('../../selectors')
const mockStore = configureMockStore([thunk])
const mockGetSavedStepForms = stepFormSelectors.getSavedStepForms as jest.MockedFunction<
  typeof stepFormSelectors.getSavedStepForms
>
const mockGetOrderedStepIds = stepFormSelectors.getOrderedStepIds as jest.MockedFunction<
  typeof stepFormSelectors.getOrderedStepIds
>
const mockGetMultiSelectLastSelected = getMultiSelectLastSelected as jest.MockedFunction<
  typeof getMultiSelectLastSelected
>
describe('steps actions', () => {
  describe('selectStep', () => {
    const stepId = 'stepId'
    beforeEach(() => {
      when(mockGetSavedStepForms)
        .calledWith(expect.anything())
        .mockReturnValue({
          stepId: {
            foo: 'getSavedStepFormsResult',
          },
        })
    })
    afterEach(() => {
      resetAllWhenMocks()
    })
    // TODO(IL, 2020-04-17): also test scroll to top behavior
    it('should select the step and populate the form', () => {
      const store = mockStore()
      // $FlowFixMe(IL, 2020-04-17): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(selectStep(stepId))
      expect(store.getActions()).toEqual([
        {
          type: 'SELECT_STEP',
          payload: stepId,
        },
        {
          type: 'POPULATE_FORM',
          payload: {
            foo: 'getSavedStepFormsResult',
          },
        },
      ])
    })
  })
  describe('selectAllSteps', () => {
    let ids
    beforeEach(() => {
      ids = ['id_1', 'id_2']
      when(mockGetOrderedStepIds)
        .calledWith(expect.anything())
        .mockReturnValue(ids)
    })
    afterEach(() => {
      resetAllWhenMocks()
    })
    it('should select all of the steps', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(selectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: ids,
          lastSelected: last(ids),
        },
      })
    })
    it('should register an analytics event', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(selectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'selectAllSteps',
          properties: {},
        },
      })
    })
  })
  describe('deselectAllSteps', () => {
    const id = 'some_id'
    beforeEach(() => {
      when(mockGetMultiSelectLastSelected)
        .calledWith(expect.anything())
        .mockReturnValue(id)
    })
    afterEach(() => {
      resetAllWhenMocks()
    })
    it('should deselect all of the steps', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(deselectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'SELECT_STEP',
        payload: id,
      })
    })
    it('should register a "deslectAllSteps" analytics event', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(deselectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'deselectAllSteps',
          properties: {},
        },
      })
    })
    it('should register a "exitBatchEditMode" analytics event when given a meta flag', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'))
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'exitBatchEditMode',
          properties: {},
        },
      })
    })
    it('should console warn when NOT in multi select mode', () => {
      when(mockGetMultiSelectLastSelected)
        .calledWith(expect.anything())
        .mockReturnValue(null)
      const consoleWarnSpy = jest
        .spyOn(global.console, 'warn')
        .mockImplementation(() => null)
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(deselectAllSteps())
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'something went wrong, cannot deselect all steps if not in multi select mode'
      )
      consoleWarnSpy.mockRestore()
    })
  })
  describe('duplicateStep', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })
    it('should duplicate a step with a new step id', () => {
      jest.spyOn(utils, 'uuid').mockReturnValue('duplicate_id')
      const store = mockStore()
      // $FlowFixMe(SA, 2021-02-01): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(duplicateStep('id_1'))
      expect(store.getActions()).toEqual([
        {
          type: 'DUPLICATE_STEP',
          payload: {
            stepId: 'id_1',
            duplicateStepId: 'duplicate_id',
          },
        },
      ])
    })
  })
  describe('duplicateMultipleSteps', () => {
    let ids
    beforeEach(() => {
      ids = ['id_1', 'id_2', 'id_3']
      when(mockGetOrderedStepIds)
        .calledWith(expect.anything())
        .mockReturnValue(ids)
      when(mockGetMultiSelectLastSelected)
        .calledWith(expect.anything())
        .mockReturnValue('id_3')
    })
    afterEach(() => {
      resetAllWhenMocks()
      jest.restoreAllMocks()
    })
    it('should duplicate multiple steps with a new step ids, and select the new duplicated steps', () => {
      jest
        .spyOn(utils, 'uuid')
        .mockReturnValueOnce('dup_1')
        .mockReturnValueOnce('dup_2')
        .mockReturnValueOnce('dup_3')
      const store = mockStore()
      // $FlowFixMe(SA, 2021-02-01): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(duplicateMultipleSteps(['id_1', 'id_2', 'id_3']))
      const duplicateStepsAction = {
        type: 'DUPLICATE_MULTIPLE_STEPS',
        payload: {
          steps: [
            {
              stepId: 'id_1',
              duplicateStepId: 'dup_1',
            },
            {
              stepId: 'id_2',
              duplicateStepId: 'dup_2',
            },
            {
              stepId: 'id_3',
              duplicateStepId: 'dup_3',
            },
          ],
          indexToInsert: 3,
        },
      }
      const selectMultipleStepsAction = {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: ['dup_1', 'dup_2', 'dup_3'],
          lastSelected: 'dup_3',
        },
      }
      expect(store.getActions()).toEqual([
        duplicateStepsAction,
        selectMultipleStepsAction,
      ])
    })
    it('should duplicate multiple steps with a new step ids, and select the new duplicated steps even when provided in a non linear order', () => {
      jest
        .spyOn(utils, 'uuid')
        .mockReturnValueOnce('dup_1')
        .mockReturnValueOnce('dup_2')
        .mockReturnValueOnce('dup_3')
      const store = mockStore()
      // $FlowFixMe(SA, 2021-02-01): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(duplicateMultipleSteps(['id_3', 'id_1', 'id_2']))
      const duplicateStepsAction = {
        type: 'DUPLICATE_MULTIPLE_STEPS',
        payload: {
          steps: [
            {
              stepId: 'id_1',
              duplicateStepId: 'dup_1',
            },
            {
              stepId: 'id_2',
              duplicateStepId: 'dup_2',
            },
            {
              stepId: 'id_3',
              duplicateStepId: 'dup_3',
            },
          ],
          indexToInsert: 3,
        },
      }
      const selectMultipleStepsAction = {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: ['dup_1', 'dup_2', 'dup_3'],
          lastSelected: 'dup_3',
        },
      }
      expect(store.getActions()).toEqual([
        duplicateStepsAction,
        selectMultipleStepsAction,
      ])
    })
  })
})
