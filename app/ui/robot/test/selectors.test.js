// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getSessionName,
  getConnectionStatus,
  getCommands,
  getRunProgress
} = selectors

describe('robot selectors', () => {
  test('getSessionName', () => {
    const state = makeState({sessionName: 'foobar.py'})
    expect(getSessionName(state)).toBe('foobar.py')
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
      protocolCommands: [0, 4],
      protocolCommandsById: {
        0: {
          id: 0,
          description: 'foo',
          handledAt: '2017-08-30T12:00:00',
          children: [1]
        },
        1: {
          id: 1,
          description: 'bar',
          handledAt: '2017-08-30T12:00:01',
          children: [2, 3]
        },
        2: {
          id: 2,
          description: 'baz',
          handledAt: '2017-08-30T12:00:02',
          children: []
        },
        3: {
          id: 3,
          description: 'qux',
          handledAt: '',
          children: []
        },
        4: {
          id: 4,
          description: 'fizzbuzz',
          handledAt: '',
          children: []
        }
      }
    })

    expect(getCommands(state)).toEqual([
      {
        id: 0,
        description: 'foo',
        handledAt: '2017-08-30T12:00:00',
        isCurrent: true,
        children: [
          {
            id: 1,
            description: 'bar',
            handledAt: '2017-08-30T12:00:01',
            isCurrent: true,
            children: [
              {
                id: 2,
                description: 'baz',
                handledAt: '2017-08-30T12:00:02',
                isCurrent: true,
                children: []
              },
              {
                id: 3,
                description: 'qux',
                handledAt: '',
                isCurrent: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 4,
        description: 'fizzbuzz',
        handledAt: '',
        isCurrent: false,
        children: []
      }
    ])
  })
})
