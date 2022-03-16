import { formatTimestamp } from '../utils'

describe('formatTimestamp', () => {
  it('should format an ISO 8601 date string', () => {
    const date = '2021-10-07T18:44:49.366581+00:00'

    const expected = '10/07/2021 14:44:49'

    expect(formatTimestamp(date)).toEqual(expected)
  })

  it('should pass through a non-ISO 8601 date string', () => {
    const date = '2/22/2022 1:00'

    expect(formatTimestamp(date)).toEqual(date)
  })

  it('should pass through a non-date string', () => {
    const noDate = 'A Protocol For Otie'

    expect(formatTimestamp(noDate)).toEqual(noDate)
  })
})
