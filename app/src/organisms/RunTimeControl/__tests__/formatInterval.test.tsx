import { formatDuration, formatInterval } from '../utils'

describe('formatInterval', () => {
  it('should format a date string interval', () => {
    const start = '2021-10-07T18:44:49.366581+00:00'
    const end = '2021-10-07T21:24:51.366999+00:00'

    const expected = '02:40:02'

    expect(formatInterval(start, end)).toEqual(expected)
  })

  it('should format a small interval with plenty of zeroes', () => {
    const start = '2021-10-07T18:44:49.366581+00:00'
    const end = '2021-10-07T18:44:51.555555+00:00'

    const expected = '00:00:02'

    expect(formatInterval(start, end)).toEqual(expected)
  })

  it('should format a large, multiday interval', () => {
    const start = '2021-10-07T18:44:49.366581+00:00'
    const end = '2021-10-19T18:44:51.555555+00:00'

    const expected = '288:00:02'

    expect(formatInterval(start, end)).toEqual(expected)
  })
})

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
