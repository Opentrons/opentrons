import { getMoveLiquidDelayData, getMixDelayData } from '../getDelayData'

describe('getMoveLiquidDelayData', () => {
  it('should return null if checkbox field is false', () => {
    expect(
      getMoveLiquidDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: false, secondsField: 3, offsetField: 2 },
        'checkboxField',
        'secondsField',
        'offsetField'
      )
    ).toBe(null)
  })

  it('should return null if either number fields <= 0 / null', () => {
    const cases = [
      [0, 5],
      [null, 5],
      [10, 0],
      [10, null],
      [-1, 2],
      [2, -1],
    ]

    cases.forEach(testCase => {
      const [secondsValue, offsetValue] = testCase
      expect(
        getMoveLiquidDelayData(
          {
            // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
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
      getMoveLiquidDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: true, secondsField: 30, offsetField: 2 },
        'checkboxField',
        'secondsField',
        'offsetField'
      )
    ).toEqual({ seconds: 30, mmFromBottom: 2 })
  })
})

describe('getMixDelayData', () => {
  it('should return null if the checkbox field is false', () => {
    expect(
      getMixDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: false, secondsField: 3 },
        'checkboxField',
        'secondsField'
      )
    ).toBe(null)
  })
  it('should return null if the seconds field is 0', () => {
    expect(
      getMixDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: true, secondsField: 0 },
        'checkboxField',
        'secondsField'
      )
    ).toBe(null)
  })
  it('should return null if the seconds field is less than 0', () => {
    expect(
      getMixDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: true, secondsField: -1 },
        'checkboxField',
        'secondsField'
      )
    ).toBe(null)
  })
  it('should return the seconds field if checckbox is checked and the seconds field is > 0', () => {
    expect(
      getMixDelayData(
        // @ts-expect-error(sa, 2021-6-15): these are not valid properties on the fields key of HydratedMoveLiquidFormData
        { checkboxField: true, secondsField: 10 },
        'checkboxField',
        'secondsField'
      )
    ).toEqual(10)
  })
})
