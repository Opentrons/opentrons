import { describe, it, expect } from 'vitest'
import { formatDuration } from '../formatDuration'

describe('formatDuration', () => {
  it('should format a duration', () => {
    const duration = {
      hours: 2,
      minutes: 40,
      seconds: 2,
    }

    const expected = '02:40:02'

    expect(formatDuration(duration)).toEqual(expected)
  })

  it('should format a short duration with plenty of zeroes', () => {
    const duration = {
      seconds: 2,
    }

    const expected = '00:00:02'

    expect(formatDuration(duration)).toEqual(expected)
  })

  it('should format a longer duration', () => {
    const duration = {
      days: 3,
      hours: 2,
      minutes: 40,
      seconds: 2,
    }

    const expected = '74:40:02'

    expect(formatDuration(duration)).toEqual(expected)
  })
})
