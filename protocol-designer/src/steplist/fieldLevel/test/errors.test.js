import {
  minFieldValue,
  maxFieldValue,
  temperatureRangeFieldValue,
} from '../errors'

describe('errors', () => {
  describe('minFieldValue', () => {
    const MIN = 4
    let minChecker
    beforeEach(() => {
      minChecker = minFieldValue(MIN)
    })
    it('returns null when value is null', () => {
      expect(minChecker(null)).toBe(null)
    })
    it('returns null when value is equal to the min', () => {
      expect(minChecker(MIN)).toBe(null)
    })
    it('returns null when value passed greater than the min', () => {
      expect(minChecker(MIN + 1)).toBe(null)
    })
    it('returns an error text when value passed less than the min', () => {
      expect(minChecker(MIN - 1)).toBe(`Min is ${MIN}`)
    })
  })
  describe('maxFieldValue', () => {
    const MAX = 95
    let maxChecker
    beforeEach(() => {
      maxChecker = maxFieldValue(MAX)
    })
    it('returns null when value is null', () => {
      expect(maxChecker(null)).toBe(null)
    })
    it('returns null when value is equal to the max', () => {
      expect(maxChecker(MAX)).toBe(null)
    })
    it('returns null when value passed less than the max', () => {
      expect(maxChecker(MAX - 1)).toBe(null)
    })
    it('returns an error text when value passed greater than the max', () => {
      expect(maxChecker(MAX + 1)).toBe(`Max is ${MAX}`)
    })
  })

  describe('temperatureRangeFieldValue', () => {
    const MIN = 4
    const MAX = 99
    let rangeChecker
    beforeEach(() => {
      rangeChecker = temperatureRangeFieldValue(MIN, MAX)
    })
    it('returns null when value is null', () => {
      expect(rangeChecker(null)).toBe(null)
    })
    it('returns null when value is equal to the min', () => {
      expect(rangeChecker(MIN)).toBe(null)
    })
    it('returns null when value passed greater than the min', () => {
      expect(rangeChecker(MIN + 1)).toBe(null)
    })
    it('returns null when value is equal to the max', () => {
      expect(rangeChecker(MAX)).toBe(null)
    })
    it('returns null when value passed less than the max', () => {
      expect(rangeChecker(MAX - 1)).toBe(null)
    })
    it('returns an error text when value passed greater than the max', () => {
      expect(rangeChecker(MAX + 1)).toBe(`Must be between ${MIN} and ${MAX} °C`)
    })

    it('returns an error text when value passed less than than the min', () => {
      expect(rangeChecker(MIN - 1)).toBe(`Must be between ${MIN} and ${MAX} °C`)
    })
  })
})
