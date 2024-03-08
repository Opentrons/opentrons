import { it, describe, expect } from 'vitest'
import { getMoveLiquidDelayData, getMixDelayData } from '../getDelayData'

describe('getMoveLiquidDelayData', () => {
  it('should return null if checkbox field is false', () => {
    const fields: any = {
      aspirate_delay_checkbox: false,
      aspirate_delay_seconds: 3,
      aspirate_delay_mmFromBottom: 2,
    }
    expect(
      getMoveLiquidDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds',
        'aspirate_delay_mmFromBottom'
      )
    ).toBe(null)
  })

  it('should return null if either seconds field is <= 0 or null, or if offset field is negative', () => {
    const cases = [
      [0, 5],
      [null, 5],
      [-1, 2],
      [2, -1],
    ]

    cases.forEach(testCase => {
      const [secondsValue, offsetValue] = testCase
      const fields: any = {
        aspirate_delay_checkbox: true,
        aspirate_delay_seconds: secondsValue,
        aspirate_delay_mmFromBottom: offsetValue,
      }
      expect(
        getMoveLiquidDelayData(
          fields,
          'aspirate_delay_checkbox',
          'aspirate_delay_seconds',
          'aspirate_delay_mmFromBottom'
        )
      ).toBe(null)
    })
  })

  it('should return seconds & mmFromBottom if checkbox is checked', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_delay_mmFromBottom: 2,
    }
    expect(
      getMoveLiquidDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds',
        'aspirate_delay_mmFromBottom'
      )
    ).toEqual({ seconds: 30, mmFromBottom: 2 })
  })

  it('should allow mmFromBottom to be zero', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_delay_mmFromBottom: 0,
    }
    expect(
      getMoveLiquidDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds',
        'aspirate_delay_mmFromBottom'
      )
    ).toEqual({ seconds: 30, mmFromBottom: 0 })
  })
})

describe('getMixDelayData', () => {
  it('should return null if the checkbox field is false', () => {
    const fields: any = {
      aspirate_delay_checkbox: false,
      aspirate_delay_seconds: 3,
    }
    expect(
      getMixDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds'
      )
    ).toBe(null)
  })
  it('should return null if the seconds field is 0', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 0,
    }
    expect(
      getMixDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds'
      )
    ).toBe(null)
  })
  it('should return null if the seconds field is less than 0', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: -1,
    }
    expect(
      getMixDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds'
      )
    ).toBe(null)
  })
  it('should return the seconds field if checckbox is checked and the seconds field is > 0', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 10,
    }
    expect(
      getMixDelayData(
        fields,
        'aspirate_delay_checkbox',
        'aspirate_delay_seconds'
      )
    ).toEqual(10)
  })
})
