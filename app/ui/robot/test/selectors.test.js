// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

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
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)
  })
})
