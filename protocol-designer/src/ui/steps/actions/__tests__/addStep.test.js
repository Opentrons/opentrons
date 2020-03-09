// @flow
import { addStep } from '../thunks/addStep'
import { selectStep } from '../actions'
import { uuid } from '../../../../utils'
jest.mock('../actions')
jest.mock('../../../../utils')

const dispatch = jest.fn()
const getState = jest.fn()
const uuidMock: JestMockFn<[], string> = uuid
const selectStepMock: JestMockFn<[string, string], *> = selectStep
const id = 'someUUID'

beforeEach(() => {
  jest.clearAllMocks()

  uuidMock.mockReturnValue(id)
  selectStepMock.mockReturnValue('selectStepMockReturnValue')
})

describe('addStep', () => {
  it('should dispatch an ADD_STEP action with given stepType and a UUID, then dispatch selectStep thunk', () => {
    const stepType = 'transfer'
    addStep({ stepType })(dispatch, getState)

    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: { stepType, id },
        },
      ],
      ['selectStepMockReturnValue'],
    ])
    expect(selectStepMock).toHaveBeenCalledTimes(1)
    expect(selectStepMock).toHaveBeenCalledWith(id, stepType)
  })
})
