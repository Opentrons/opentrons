// @flow
import { getDelayData } from '../getDelayData'

describe('getDelayData', () => {
  it('should return null if checkbox field is false', () => {
    expect(
      getDelayData(
        { checkboxField: false, secondsField: 3, offsetField: 2 },
        'checkboxField',
        'secondsField',
        'offsetField'
      )
    ).toBe(null)
  })

  it('should return null if either number fields <= 0 / null', () => {
    const cases = [[0, 5], [null, 5], [10, 0], [10, null], [-1, 2], [2, -1]]

    cases.forEach(testCase => {
      const [secondsValue, offsetValue] = testCase
      expect(
        getDelayData(
          {
            checkboxField: true,
            secondsField: secondsValue,
            offsetField: offsetValue,
          },
          'checkboxField',
          'secondsField',
          'offsetField'
        )
      ).toBe(null)
    })
  })

  it('should return seconds & mmFromBottom if checkbox is checked', () => {
    expect(
      getDelayData(
        { checkboxField: true, secondsField: 30, offsetField: 2 },
        'checkboxField',
        'secondsField',
        'offsetField'
      )
    ).toEqual({ seconds: 30, mmFromBottom: 2 })
  })
})
