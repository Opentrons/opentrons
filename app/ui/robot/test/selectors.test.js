// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

describe('robot selectors', () => {
  it('should be able to get connection status', () => {
    const {getConnectionStatus} = selectors

    let state = {isConnected: false, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)
  })
})
