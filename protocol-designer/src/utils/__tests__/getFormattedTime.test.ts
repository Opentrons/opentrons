import { describe, expect, it } from 'vitest'

import { getFormattedTime } from '../getFormattedTime'

describe('getFormattedTime', () => {
  describe('default outputFormat MM:SS', () => {
    it('returns MM:SS for bare seconds (no colon)', () => {
      expect(getFormattedTime('1')).toBe('00:01')
      expect(getFormattedTime('45')).toBe('00:45')
    })
    it('returns MM:SS for minutes:seconds (one colon)', () => {
      expect(getFormattedTime('0:1')).toBe('00:01')
      expect(getFormattedTime('1:1')).toBe('01:01')
      expect(getFormattedTime('5:30')).toBe('05:30')
    })
    it('collapses hours to total minutes for 3-part input', () => {
      expect(getFormattedTime('1:30:45')).toBe('90:45')
      expect(getFormattedTime('2:5:9')).toBe('125:09')
    })
  })

  describe('outputFormat HH:MM:SS', () => {
    it('returns 00:00:SS for bare seconds', () => {
      expect(getFormattedTime('1', 'hhmmss')).toBe('00:00:01')
      expect(getFormattedTime('45', 'hhmmss')).toBe('00:00:45')
    })
    it('returns 00:MM:SS for minutes:seconds', () => {
      expect(getFormattedTime('5:30', 'hhmmss')).toBe('00:05:30')
      expect(getFormattedTime('1:1', 'hhmmss')).toBe('00:01:01')
    })
    it('returns HH:MM:SS for hours:minutes:seconds', () => {
      expect(getFormattedTime('1:30:45', 'hhmmss')).toBe('01:30:45')
      expect(getFormattedTime('2:5:9', 'hhmmss')).toBe('02:05:09')
    })
  })
})
