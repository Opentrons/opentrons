import { describe, expect, it } from 'vitest'

import { getYearFromDate } from '../utils'

describe('getYearFromDate', () => {
  it('should return the current year', () => {
    const currentYear = new Date().getFullYear()
    expect(getYearFromDate()).toBe(currentYear)
  })

  it('should return a number', () => {
    const result = getYearFromDate()
    expect(typeof result).toBe('number')
  })
})
