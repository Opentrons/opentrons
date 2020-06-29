// @flow
import { getFieldErrors } from '../../steplist/fieldLevel'
import { _hasFieldLevelErrors } from '../selectors'
import { getProfileItemsHaveErrors } from '../utils/getProfileItemsHaveErrors'
jest.mock('../../steplist/fieldLevel')
jest.mock('../utils/getProfileItemsHaveErrors')

const mockGetFieldErrors: JestMockFn<
  [string, mixed],
  Array<string>
> = getFieldErrors

const mockGetProfileItemsHaveErrors: JestMockFn<
  [any],
  boolean
> = getProfileItemsHaveErrors

beforeEach(() => {
  jest.clearAllMocks()
})

describe('_hasFieldLevelErrors', () => {
  it('should return true if form is "thermocycler", has "profileItemsById" field, and _getProfileItemsHaveErrors returns true', () => {
    const formData = {
      stepType: 'thermocycler',
      profileItemsById: { foo: 'abc' },
    }
    mockGetProfileItemsHaveErrors.mockImplementation(profileItems => {
      expect(profileItems).toEqual(formData.profileItemsById)
      return true
    })
    const result = _hasFieldLevelErrors(formData)
    expect(mockGetProfileItemsHaveErrors).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  const testCases = [
    {
      testName: 'should return true if form has field errors',
      mockGetFieldErrorsReturn: ['some error'],
      expected: true,
    },
    {
      testName: 'should return false if form has no field errors',
      mockGetFieldErrorsReturn: [],
      expected: false,
    },
  ]

  testCases.forEach(({ testName, mockGetFieldErrorsReturn, expected }) => {
    it(testName, () => {
      mockGetFieldErrors.mockImplementation((name, value) => {
        expect(name).toEqual('blah')
        expect(value).toEqual('spam')
        return mockGetFieldErrorsReturn
      })

      const formData: any = { blah: 'spam' }
      const result = _hasFieldLevelErrors(formData)
      expect(result).toBe(expected)
    })
  })
})
