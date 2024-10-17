import { describe, it, expect } from 'vitest'
import { latestVersionForChannel } from '../latest-update'

describe('latest-update', () => {
  it.each([
    ['8.0.0', '7.0.0', '8.0.0', ''],
    ['7.0.0', '8.0.0', '8.0.0', ''],
    ['8.10.0', '8.9.0', '8.10.0', ''],
    ['8.9.0', '8.10.0', '8.10.0', ''],
    ['8.0.0-alpha.0', '8.0.0-alpha.1', '8.0.0-alpha.1', 'alpha'],
    ['8.0.0-alpha.1', '8.0.0-alpha.0', '8.0.0-alpha.1', 'alpha'],
    ['8.1.0-alpha.0', '8.0.0-alpha.1', '8.1.0-alpha.0', 'alpha'],
    ['8.0.0-alpha.1', '8.1.0-alpha.0', '8.1.0-alpha.0', 'alpha'],
  ])(
    'choosing between %s and %s should result in %s',
    (first, second, higher, channel) => {
      expect(latestVersionForChannel([first, second], channel)).toEqual(higher)
    }
  )
  it('ignores updates from different channels', () => {
    expect(
      latestVersionForChannel(
        ['8.0.0', '9.0.0-alpha.0', '10.0.0-beta.1', '2.0.0'],
        'production'
      )
    ).toEqual('8.0.0')
    expect(
      latestVersionForChannel(
        ['8.0.0', '9.0.0-alpha.0', '10.0.0-beta.1', '2.0.0'],
        'alpha'
      )
    ).toEqual('9.0.0-alpha.0')
    expect(
      latestVersionForChannel(
        ['8.0.0', '9.0.0-alpha.0', '10.0.0-beta.1', '2.0.0'],
        'beta'
      )
    ).toEqual('10.0.0-beta.1')
  })
})
