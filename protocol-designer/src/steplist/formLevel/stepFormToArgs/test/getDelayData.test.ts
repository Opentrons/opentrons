import { describe, expect, it } from 'vitest'

import { getMixDelayData, getMoveLiquidDelayData } from '../getDelayData'

describe('getMoveLiquidDelayData', () => {
  it('should return null if checkbox field is false', () => {
    const fields: any = {
      aspirate_delay_checkbox: false,
      aspirate_delay_seconds: 3,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        checkboxField: 'aspirate_delay_checkbox',
      })
    ).toBe(null)
  })

  it('should return null if either seconds field is <= 0 or null', () => {
    const cases = [[0], [null], [-1]]

    cases.forEach(testCase => {
      const [secondsValue] = testCase
      const fields: any = {
        aspirate_delay_checkbox: true,
        aspirate_delay_seconds: secondsValue,
      }
      expect(
        getMoveLiquidDelayData({
          hydratedFormData: fields,
          secondsField: 'aspirate_delay_seconds',
          checkboxField: 'aspirate_delay_checkbox',
        })
      ).toBe(null)
    })
  })

  it('should return seconds if checkbox is checked', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_x_position: 10,
      aspirate_y_position: 10,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        checkboxField: 'aspirate_delay_checkbox',
      })
    ).toEqual({ seconds: 30 })
  })

  it('should allow mmFromBottom to be zero', () => {
    const fields: any = {
      aspirate_delay_checkbox: true,
      aspirate_delay_seconds: 30,
      aspirate_x_position: 10,
      aspirate_y_position: 10,
    }
    expect(
      getMoveLiquidDelayData({
        hydratedFormData: fields,
        secondsField: 'aspirate_delay_seconds',
        checkboxField: 'aspirate_delay_checkbox',
      })
    ).toEqual({ seconds: 30 })
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
