import { formatSeconds } from '../utils'

describe('utils', function () {
  describe('format', function () {
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
})
