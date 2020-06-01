// @flow
import { getProfileFieldErrors } from '../../steplist/fieldLevel'
import { getProfileItemsHaveErrors } from '../utils/getProfileItemsHaveErrors'
jest.mock('../../steplist/fieldLevel')

const mockGetProfileFieldErrors: JestMockFn<
  [string, string],
  Array<string>
> = getProfileFieldErrors

describe('getProfileItemsHaveErrors', () => {
  const testCases = [
    {
      testName: 'should return true if there are errors',
      mockGetProfileFieldErrorsReturn: ['some error'],
      expected: true,
    },
    {
      testName: 'should return false if there are no errors',
      mockGetProfileFieldErrorsReturn: [],
      expected: false,
    },
  ]

  testCases.forEach(
    ({ testName, mockGetProfileFieldErrorsReturn, expected }) => {
      it(testName, () => {
        const profileItems: { [id: string]: any } = {
          itemA: { field1: '1', field2: '2', field3: '3' },
        }
        mockGetProfileFieldErrors.mockImplementation((name, value) => {
          expect(profileItems['itemA']).toHaveProperty(name, value)
          return mockGetProfileFieldErrorsReturn
        })

        const result = getProfileItemsHaveErrors(profileItems)
        expect(result).toBe(expected)
      })
    }
  )
})
