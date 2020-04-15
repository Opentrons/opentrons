// @flow
import { addStep } from '../thunks/addStep'
import { uuid } from '../../../../utils'
jest.mock('../actions')
jest.mock('../../../../utils')

const uuidMock: JestMockFn<[], string> = uuid
const id = 'someUUID'

beforeEach(() => {
  jest.clearAllMocks()

  uuidMock.mockReturnValue(id)
})

describe('addStep', () => {
  it('should dispatch an ADD_STEP action with given stepType and a UUID', () => {
    const stepType = 'transfer'
    expect(addStep({ stepType })).toEqual({
      type: 'ADD_STEP',
      payload: { stepType, id },
    })
  })
})
