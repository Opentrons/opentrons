// @flow
import last from 'lodash/last'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { when, resetAllWhenMocks } from 'jest-when'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getMultiSelectLastSelected } from '../../selectors'
import { selectStep, selectAllSteps, deselectAllSteps } from '../actions'

jest.mock('../../../../step-forms')
jest.mock('../../selectors')

const mockStore = configureMockStore([thunk])

const mockGetSavedStepForms: JestMockFn<[Object], any> =
  stepFormSelectors.getSavedStepForms

const mockGetOrderedStepIds: JestMockFn<[Object], any> =
  stepFormSelectors.getOrderedStepIds

const mockGetMultiSelectLastSelected: JestMockFn<
  [Object],
  any
> = getMultiSelectLastSelected

describe('steps actions', () => {
  describe('selectStep', () => {
    const stepId = 'stepId'
    beforeEach(() => {
      when(mockGetSavedStepForms)
        .calledWith(expect.anything())
        .mockReturnValue({
          stepId: { foo: 'getSavedStepFormsResult' },
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
        { type: 'SELECT_STEP', payload: stepId },
        { type: 'POPULATE_FORM', payload: { foo: 'getSavedStepFormsResult' } },
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
      expect(store.getActions()).toEqual([
        {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: { stepIds: ids, lastSelected: last(ids) },
        },
      ])
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

    it('should deselect all of the steps when in multi select mode', () => {
      const store = mockStore()
      // $FlowFixMe(SA, 2021-01-21): redux-mock-store dispatch types not cooperating. Related TypeScript issue: https://github.com/reduxjs/redux-mock-store/issues/148
      store.dispatch(deselectAllSteps())
      expect(store.getActions()).toEqual([
        {
          type: 'SELECT_STEP',
          payload: id,
        },
      ])
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
      expect(store.getActions()).toEqual([])
      consoleWarnSpy.mockRestore()
    })
  })
})
