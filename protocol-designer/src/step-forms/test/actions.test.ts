import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { when } from 'vitest-when'
import { saveStepFormsMulti } from '../actions'
import { getBatchEditFieldChanges } from '../selectors'

vi.mock('../selectors')

const mockStore = configureMockStore([thunk])

describe('saveStepFormsMulti', () => {
  let store: any
  beforeEach(() => {
    store = mockStore()
    when(vi.mocked(getBatchEditFieldChanges))
      .calledWith(expect.anything())
      .thenReturn({ someField: 'someVal' })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
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
