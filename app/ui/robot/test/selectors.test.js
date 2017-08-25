// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getProtocolFile,
  getProtocolName,
  getConnectionStatus,
  getCommands,
  getRunProgress
} = selectors

describe('robot selectors', () => {
  test('getProtocolFile and getProtocolName', () => {
    const state = makeState({protocol: '/path/to/some/protocol/foobar.py'})
    expect(getProtocolFile(state)).toBe('/path/to/some/protocol/foobar.py')
    expect(getProtocolName(state)).toBe('foobar.py')
  })

  test('getConnectionStatus', () => {
    let state = {isConnected: false, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)
  })

  test('getCommands', () => {
    const state = makeState({
      commands: ['foo', 'bar', 'baz', 'qux'],
      currentCommand: 2
    })

    expect(getCommands(state)).toEqual([
      {id: 0, description: 'foo', isCurrent: false},
      {id: 1, description: 'bar', isCurrent: false},
      {id: 2, description: 'baz', isCurrent: true},
      {id: 3, description: 'qux', isCurrent: false}
    ])
  })

  test('getRunProgress', () => {
    const commands = ['foo', 'bar', 'baz', 'qux']

    let state = makeState({commands, currentCommand: -1})
    expect(getRunProgress(state)).toBe(0)

    state = makeState({commands, currentCommand: 2})
    expect(getRunProgress(state)).toBe(75)

    state = makeState({commands, currentCommand: 3})
    expect(getRunProgress(state)).toBe(100)
  })
})
