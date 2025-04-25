import { describe, expect, it } from 'vitest'

import { getMixDelayData, getMoveLiquidDelayData } from '../getDelayData'

describe('getMoveLiquidDelayData', () => {
  it('should return null if checkbox field is false', () => {
    const fields: any = {
      aspirate_delay_checkbox: false,
      aspirate_delay_seconds: 3,
      aspirate_delay_mmFromBottom: 2,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        zPositionField: 'aspirate_mmFromBottom',
        checkboxField: 'aspirate_delay_checkbox',
      })
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
        aspirate_mmFromBottom: offsetValue,
      }
      expect(
        getMoveLiquidDelayData({
          hydratedFormData: fields,
          secondsField: 'aspirate_delay_seconds',
          zPositionField: 'aspirate_mmFromBottom',
          checkboxField: 'aspirate_delay_checkbox',
        })
      ).toBe(null)
    })
  })

  it('should return seconds & mmFromBottom if checkbox is checked', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_x_position: 10,
      aspirate_y_position: 10,
      aspirate_mmFromBottom: 2,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        zPositionField: 'aspirate_mmFromBottom',
        checkboxField: 'aspirate_delay_checkbox',
      })
    ).toEqual({ seconds: 30, mmFromBottom: 2 })
  })

  it('should allow mmFromBottom to be zero', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_mmFromBottom: 0,
      aspirate_x_position: 10,
      aspirate_y_position: 10,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        zPositionField: 'aspirate_mmFromBottom',
        checkboxField: 'aspirate_delay_checkbox',
      })
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
