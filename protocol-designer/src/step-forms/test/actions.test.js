// @flow
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'
import { saveStepFormsMulti } from '../actions'
import { getBatchEditFieldChanges } from '../selectors'

jest.mock('../selectors')
const mockStore = configureMockStore([thunk])
const mockGetBatchEditFieldChanges = getBatchEditFieldChanges

describe('saveStepFormsMulti', () => {
  let store
  beforeEach(() => {
    store = mockStore()
    when(mockGetBatchEditFieldChanges)
      .calledWith(expect.anything())
      .mockReturnValue({ someField: 'someVal' })
  })
  afterEach(() => resetAllWhenMocks())
  it('should dispatch SAVE_STEP_FORMS_MULTI with edited fields and step ids when step ids are passed in', () => {
    const stepIds = ['1', '2']
    store.dispatch(saveStepFormsMulti(stepIds))
    expect(store.getActions()).toEqual([
      {
        type: 'SAVE_STEP_FORMS_MULTI',
        payload: {
          editedFields: { someField: 'someVal' },
          stepIds: stepIds,
        },
      },
    ])
  })
  it('should dispatch SAVE_STEP_FORMS_MULTI with edited fields and step ids when step ids are NOT passed in', () => {
    store.dispatch(saveStepFormsMulti())
    expect(store.getActions()).toEqual([
      {
        type: 'SAVE_STEP_FORMS_MULTI',
        payload: {
          editedFields: { someField: 'someVal' },
          stepIds: [],
        },
      },
    ])
  })
})
