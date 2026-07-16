import { describe, expect, it } from "vitest";
import { getSpeedMultiplierText } from '../getSpeedMultiplierText'

describe('getSpeedMultiplierText', () => {
  it('returns the correct label', () => {
    expect(getSpeedMultiplierText(250)).toBe('4x')
    expect(getSpeedMultiplierText(500)).toBe('2x')
    expect(getSpeedMultiplierText(1000)).toBe('1x')
    expect(getSpeedMultiplierText(2000)).toBe('0.5x')
    expect(getSpeedMultiplierText(3000)).toBe('0.33x')
  })
})
