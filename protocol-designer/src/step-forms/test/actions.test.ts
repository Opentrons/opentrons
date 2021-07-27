import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'
import { saveStepFormsMulti } from '../actions'
import { getBatchEditFieldChanges } from '../selectors'
jest.mock('../selectors')
const mockStore = configureMockStore([thunk])
const mockGetBatchEditFieldChanges = getBatchEditFieldChanges as jest.MockedFunction<
  typeof getBatchEditFieldChanges
>
describe('saveStepFormsMulti', () => {
  let store: any
  beforeEach(() => {
    store = mockStore()
    when(mockGetBatchEditFieldChanges)
      .calledWith(expect.anything())
      .mockReturnValue({
        someField: 'someVal',
      })
  })
  afterEach(() => resetAllWhenMocks())
  it('should dispatch SAVE_STEP_FORMS_MULTI with edited fields and step ids', () => {
    const stepIds = ['1', '2']
    store.dispatch(saveStepFormsMulti(stepIds))
    expect(store.getActions()).toEqual([
      {
        type: 'SAVE_STEP_FORMS_MULTI',
        payload: {
          editedFields: {
            someField: 'someVal',
          },
          stepIds: stepIds,
        },
      },
    ])
  })
  it('should dispatch SAVE_STEP_FORMS_MULTI with step ids as empty list when step ids are NOT passed in', () => {
    store.dispatch(saveStepFormsMulti())
    expect(store.getActions()).toEqual([
      {
        type: 'SAVE_STEP_FORMS_MULTI',
        payload: {
          editedFields: {
            someField: 'someVal',
          },
          stepIds: [],
        },
      },
    ])
  })
})
