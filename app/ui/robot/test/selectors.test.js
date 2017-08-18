// robot selectors test
import {selectors, constants} from '../'

describe('robot selectors', () => {
  it('should be able to get connection status', () => {
    const {getConnectionStatus} = selectors

    let state = {isConnected: false, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(state)).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(state)).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(state)).toBe(constants.CONNECTED)
  })
})
