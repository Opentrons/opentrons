// tests for the api client
import {delay} from '../../util'
import client from '../api-client/client'
import RpcClient from '../../../rpc/client'
import {NAME, actions} from '../'

import MockSession from './__mocks__/session'
import MockCalibrationMangager from './__mocks__/calibration-manager'

jest.mock('../../../rpc/client')

describe('api client', () => {
  let dispatch
  let sendToClient
  let rpcClient
  let session
  let sessionManager
  let calibrationManager

  let _global = {}
  beforeAll(() => {
    _global = {setInterval, clearInterval}

    global.setInterval = jest.fn()
    global.clearInterval = jest.fn()
  })

  afterAll(() => {
    Object.keys(_global).forEach((method) => (global[method] = _global[method]))
  })

  beforeEach(() => {
    // TODO(mc, 2017-08-29): this is a pretty nasty mock. Probably a sign we
    // need to simplify the RPC client
    // mock robot, session, and session manager
    session = MockSession()
    calibrationManager = MockCalibrationMangager()

    // mock rpc client
    sessionManager = {session}
    rpcClient = {
      // TODO(mc, 2017-09-22): these jest promise mocks are causing promise
      // rejection warnings. These warnings are Jest's fault for nextTick stuff
      // http://clarkdave.net/2016/09/node-v6-6-and-asynchronously-handled-promise-rejections/
      on: jest.fn(() => rpcClient),
      close: jest.fn(),
      remote: {
        session_manager: sessionManager,
        calibration_manager: calibrationManager
      }
    }

    dispatch = jest.fn()
    RpcClient.mockReturnValue(Promise.resolve(rpcClient))

    const _receive = client(dispatch)

    sendToClient = (state, action) => {
      _receive(state, action)
      return delay(1)
    }
  })

  afterEach(() => {
    RpcClient.mockReset()
  })

  const sendConnect = () => sendToClient({}, actions.connect())
  const sendDisconnect = () => sendToClient({}, actions.disconnect())

  describe('connect and disconnect', () => {
    test('connect RpcClient on CONNECT message', () => {
      const expectedResponse = actions.connectResponse()

      expect(RpcClient).toHaveBeenCalledTimes(0)

      return sendConnect()
        .then(() => {
          expect(RpcClient).toHaveBeenCalledTimes(1)
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('dispatch CONNECT_RESPONSE error if connection fails', () => {
      const error = new Error('AHH get_root')
      const expectedResponse = actions.connectResponse(error)

      RpcClient.mockReturnValueOnce(Promise.reject(error))

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('dispatch CONNECT_RESPONSE success if already connected', () => {
      const expectedResponse = actions.connectResponse()

      return sendConnect()
        .then(() => {
          RpcClient.mockClear()
          dispatch.mockClear()
          return sendConnect()
        })
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
          expect(RpcClient).toHaveBeenCalledTimes(0)
        })
    })

    test('dispatch DISCONNECT_RESPONSE if already disconnected', () => {
      const expected = actions.disconnectResponse()

      return sendDisconnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('disconnect RPC on DISCONNECT message', () => {
      const expected = actions.disconnectResponse()

      rpcClient.close.mockReturnValueOnce(Promise.resolve())

      return sendConnect()
        .then(() => sendDisconnect())
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('dispatch DISCONNECT_RESPONSE if close errors', () => {
      const expected = actions.disconnectResponse(new Error('AH'))

      rpcClient.close.mockReturnValueOnce(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendDisconnect())
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })
  })

  describe('running', () => {
    test('start a timer when the run starts', () => {
      session.run.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient({}, actions.run()))
        .then(() => expect(global.setInterval).toHaveBeenCalled())
    })
  })

  describe('session responses', () => {
    test('dispatches sessionResponse on connect', () => {
      const expected = actions.sessionResponse(null, {
        name: session.name,
        state: session.state,
        errors: [],
        protocolText: session.protocol_text,
        protocolCommands: [],
        protocolCommandsById: {},
        protocolInstrumentsByAxis: {},
        protocolLabwareBySlot: {}
      })

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('handles connnect without session', () => {
      const notExpected = actions.sessionResponse(null, expect.anything())

      sessionManager.session = null

      return sendConnect()
        .then(() => expect(dispatch).not.toHaveBeenCalledWith(notExpected))
    })

    test('maps api session commands and command log to commands', () => {
      const expected = actions.sessionResponse(null, expect.objectContaining({
        protocolCommands: [0, 4],
        protocolCommandsById: {
          0: {id: 0, description: 'a', handledAt: 0, children: [1]},
          1: {id: 1, description: 'b', handledAt: 1, children: [2, 3]},
          2: {id: 2, description: 'c', handledAt: 2, children: []},
          3: {id: 3, description: 'd', handledAt: '', children: []},
          4: {id: 4, description: 'e', handledAt: '', children: []}
        }
      }))

      session.commands = [
        {
          id: 0,
          description: 'a',
          children: [
            {
              id: 1,
              description: 'b',
              children: [
                {id: 2, description: 'c', children: []},
                {id: 3, description: 'd', children: []}
              ]
            }
          ]
        },
        {id: 4, description: 'e', children: []}
      ]
      session.command_log = {
        0: {timestamp: 0},
        1: {timestamp: 1},
        2: {timestamp: 2}
      }

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('maps api instruments and intruments by axis', () => {
      const expected = actions.sessionResponse(null, expect.objectContaining({
        protocolInstrumentsByAxis: {
          left: {_id: 2, axis: 'left', name: 'p200', channels: 1, volume: 200},
          right: {_id: 1, axis: 'right', name: 'p50', channels: 8, volume: 50}
        }
      }))

      session.instruments = [
        {_id: 1, axis: 'a', name: 'p50', channels: 8},
        {_id: 2, axis: 'b', name: 'p200', channels: 1}
      ]

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('maps api containers to labware by slot', () => {
      const expected = actions.sessionResponse(null, expect.objectContaining({
        protocolLabwareBySlot: {
          1: {_id: 1, id: 'A1', slot: 1, name: 'a', type: 'tiprack', isTiprack: true},
          5: {_id: 2, id: 'B2', slot: 5, name: 'b', type: 'B', isTiprack: false},
          9: {_id: 3, id: 'C3', slot: 9, name: 'c', type: 'C', isTiprack: false}
        }
      }))

      session.containers = [
        {_id: 1, slot: 'A1', name: 'a', type: 'tiprack'},
        {_id: 2, slot: 'B2', name: 'b', type: 'B'},
        {_id: 3, slot: 'C3', name: 'c', type: 'C'}
      ]

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })
  })

  describe('calibration', () => {
    let state
    beforeEach(() => {
      state = {
        [NAME]: {
          session: {
            protocolInstrumentsByAxis: {
              left: {_id: 'inst-2'},
              right: {_id: 'inst-1'}
            },
            protocolLabwareBySlot: {
              1: {_id: 'lab-1'},
              5: {_id: 'lab-2'},
              9: {_id: 'lab-3'}
            }
          }
        }
      }
    })

    test('handles MOVE_TO_FRONT success', () => {
      const action = actions.moveToFront('left')
      const expectedResponse = actions.moveToFrontResponse()

      calibrationManager.move_to_front.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.move_to_front)
            .toHaveBeenCalledWith({_id: 'inst-2'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles MOVE_TO_FRONT failure', () => {
      const action = actions.moveToFront('left')
      const expectedResponse = actions.moveToFrontResponse(new Error('AH'))

      calibrationManager.move_to_front
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles PROBE_TIP success', () => {
      const action = actions.probeTip('right')
      const expectedResponse = actions.probeTipResponse()

      calibrationManager.tip_probe.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.tip_probe)
            .toHaveBeenCalledWith({_id: 'inst-1'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles PROBE_TIP failure', () => {
      const action = actions.probeTip('right')
      const expectedResponse = actions.probeTipResponse(new Error('AH'))

      calibrationManager.tip_probe
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles MOVE_TO success', () => {
      const action = actions.moveTo('left', 5)
      const expectedResponse = actions.moveToResponse()

      calibrationManager.move_to.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.move_to)
            .toHaveBeenCalledWith({_id: 'inst-2'}, {_id: 'lab-2'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles MOVE_TO failure', () => {
      const action = actions.moveTo('left', 5)
      const expectedResponse = actions.moveToResponse(new Error('AH'))

      calibrationManager.move_to
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles JOG success', () => {
      const action = actions.jog('left', 'y', -1)
      const expectedResponse = actions.jogResponse()

      calibrationManager.jog.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.jog)
            .toHaveBeenCalledWith({_id: 'inst-2'}, -0.25, 'y')
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles JOG failure', () => {
      const action = actions.jog('left', 'x', 1)
      const expectedResponse = actions.jogResponse(new Error('AH'))

      calibrationManager.jog.mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles UPDATE_OFFSET success', () => {
      const action = actions.updateOffset('left', 9)
      const expectedResponse = actions.updateOffsetResponse()

      calibrationManager.update_container_offset
        .mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.update_container_offset)
            .toHaveBeenCalledWith({_id: 'lab-3'}, {_id: 'inst-2'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles UPDATE_OFFSET failure', () => {
      const action = actions.updateOffset('left', 9)
      const expectedResponse = actions.updateOffsetResponse(new Error('AH'))

      calibrationManager.update_container_offset
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })
  })
})
