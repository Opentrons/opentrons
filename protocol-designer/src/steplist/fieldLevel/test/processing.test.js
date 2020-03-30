import { maskToFloat, trimDecimals } from '../processing'

describe('Value Casters', () => {
  describe('maskToFloat', () => {
    it('returns string representation of integer when the input is an integer', () => {
      expect(maskToFloat(1)).toBe('1')
      expect(maskToFloat('1')).toBe('1')
      expect(maskToFloat(109213097)).toBe('109213097')
      expect(maskToFloat('109213097')).toBe('109213097')
      expect(maskToFloat(-12837)).toBe('-12837')
      expect(maskToFloat('-12837')).toBe('-12837')
    })
    it('does not truncate decimals', () => {
      expect(maskToFloat(0.00001)).toBe('0.00001')
      expect(maskToFloat('0.00001')).toBe('0.00001')
      expect(maskToFloat(21.0123)).toBe('21.0123')
      expect(maskToFloat('21.0123')).toBe('21.0123')
      expect(maskToFloat(-9211.0987)).toBe('-9211.0987')
      expect(maskToFloat('-9211.0987')).toBe('-9211.0987')
    })
  })

  describe('trimDecimals', () => {
    it('removes one decimal', () => {
      const trimByOne = trimDecimals(1)
      expect(trimByOne(0.00001)).toBe('0.0')
      expect(trimByOne('0.00001')).toBe('0.0')
      expect(trimByOne(21.123)).toBe('21.1')
      expect(trimByOne('21.123')).toBe('21.1')
      expect(trimByOne(-9211.987)).toBe('-9211.9')
      expect(trimByOne('-9211.987')).toBe('-9211.9')
    })
    it('removes two decimals', () => {
      const trimByTwo = trimDecimals(2)
      expect(trimByTwo(0.00001)).toBe('0.00')
      expect(trimByTwo('0.00001')).toBe('0.00')
      expect(trimByTwo(21.123)).toBe('21.12')
      expect(trimByTwo('21.123')).toBe('21.12')
      expect(trimByTwo(-9211.987)).toBe('-9211.98')
      expect(trimByTwo('-9211.987')).toBe('-9211.98')
    })
  })
})
