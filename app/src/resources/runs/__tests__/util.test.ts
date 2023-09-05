import { formatTimeWithUtcLabel } from '../utils'

describe('formatTimeWithUtc', () => {
  it('return formatted time with UTC', () => {
    const result = formatTimeWithUtcLabel('2023-08-20T20:25')
    expect(result).toEqual('8/20/23 20:25 UTC')
  })
  it('return formatted time with UTC without T', () => {
    const result = formatTimeWithUtcLabel('08/22/2023 21:35:04')
    expect(result).toEqual('8/22/23 21:35 UTC')
  })

  it('return formatted time with UTC only hh:mm', () => {
    const result = formatTimeWithUtcLabel('21:35:04')
    expect(result).toEqual('21:35:04 UTC')
  })

  it('return unknown if time is null', () => {
    const result = formatTimeWithUtcLabel(null)
    expect(result).toEqual('unknown')
  })
})
