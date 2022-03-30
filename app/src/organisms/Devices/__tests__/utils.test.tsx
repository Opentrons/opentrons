import { formatTimestamp } from '../utils'

describe('formatTimestamp', () => {
  it('should format an ISO 8601 date string', () => {
    const date = '2021-03-07T18:44:49.366581+00:00'

    expect(formatTimestamp(date)).toMatch(
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
    )
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
