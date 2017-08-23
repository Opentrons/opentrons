// robot selectors test
import {selectors, constants} from '../'

const {
  getProtocolFile,
  getProtocolName,
  getConnectionStatus
} = selectors

describe('robot selectors', () => {
  test('getProtocolFile and getProtocolName', () => {
    const state = {protocol: '/path/to/some/protocol/foobar.py'}
    expect(getProtocolFile(state)).toBe('/path/to/some/protocol/foobar.py')
    expect(getProtocolName(state)).toBe('foobar.py')
  })

  it('should be able to get connection status', () => {
    let state = {isConnected: false, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(state)).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(state)).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(state)).toBe(constants.CONNECTED)
  })
})
