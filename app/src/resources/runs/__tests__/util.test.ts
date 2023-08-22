import { formatTimeWithUtcLabel } from '../utils'

describe('formatTimeWithUtc', () => {
  it('return formatted time with UTC', () => {
    const result = formatTimeWithUtcLabel('2023-08-20T20:25')
    expect(result).toEqual('8/20/23 20:25 UTC')
  })
})
