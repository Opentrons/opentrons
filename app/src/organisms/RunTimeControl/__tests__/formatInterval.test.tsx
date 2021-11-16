import { formatInterval } from '../utils'

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
