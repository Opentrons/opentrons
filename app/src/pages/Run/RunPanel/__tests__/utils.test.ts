import { formatSeconds, formatTime } from '../utils'
import { format } from 'date-fns'

describe('utils', function () {
  describe('formatSeconds', function () {
    const tests: Array<{
      expected: string
      seconds: number
    }> = [
      {
        expected: '00:00:00',
        seconds: 0,
      },
      {
        expected: '00:00:01',
        seconds: 1,
      },
      {
        expected: '00:00:59',
        seconds: 59,
      },
      {
        expected: '00:01:00',
        seconds: 60,
      },
      {
        expected: '00:59:59',
        seconds: 60 * 59 + 59,
      },
      {
        expected: '01:00:00',
        seconds: 60 * 60,
      },
      {
        expected: '11:10:09',
        seconds: 60 * 60 * 11 + 60 * 10 + 9,
      },
    ]

    tests.forEach(({ expected, seconds }) => {
      it(`should format ${seconds} seconds as ${expected}`, function () {
        expect(formatSeconds(seconds)).toBe(expected)
      })
    })
  })

  describe('formatTime', function () {
    it(`should format undefined as empty string`, function () {
      expect(formatTime(undefined)).toBe('')
    })

    it(`should format null as empty string`, function () {
      expect(formatTime(null)).toBe('')
    })

    it(`should format as 'format' would otherwise`, function () {
      const time = Date.now()
      expect(formatTime(time)).toBe(format(time, 'pp'))
    })
  })
})
