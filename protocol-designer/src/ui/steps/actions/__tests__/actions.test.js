// @flow
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectStep } from '../actions'
jest.mock('../../../../step-forms')

const mockStore = configureMockStore([thunk])

const mockGetSavedStepForms: JestMockFn<[Object], any> =
  stepFormSelectors.getSavedStepForms

describe('steps actions', () => {
  describe('selectStep', () => {
    const stepId = 'stepId'
    beforeEach(() => {
      mockGetSavedStepForms.mockReturnValue({
        stepId: { foo: 'getSavedStepFormsResult' },
      })
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
})
