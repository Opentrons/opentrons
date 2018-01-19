// tests for the api client
import {push} from 'react-router-redux'

import {delay} from '../../util'
import client from '../api-client/client'
import RpcClient from '../../rpc/client'
import {tagAlertAction} from '../../interface'
import {NAME, actions, constants} from '../'

import MockSession from './__mocks__/session'
import MockCalibrationMangager from './__mocks__/calibration-manager'

jest.mock('../../rpc/client')

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

  const ROBOT_NAME = 'ot'
  const ROBOT_IP = '127.0.0.01'
  const STATE = {
    [NAME]: {
      connection: {
        discoveredByName: {
          [ROBOT_NAME]: {ip: ROBOT_IP, port: 31950}
        }
      }
    }
  }

  const sendConnect = () => sendToClient(STATE, actions.connect(ROBOT_NAME))
  const sendDisconnect = () => sendToClient(STATE, actions.disconnect())

  describe('connect and disconnect', () => {
    test('connect RpcClient on CONNECT message', () => {
      const expectedResponse = actions.connectResponse()

      expect(RpcClient).toHaveBeenCalledTimes(0)

      return sendConnect()
        .then(() => {
          expect(RpcClient).toHaveBeenCalledWith(`ws://${ROBOT_IP}:31950`)
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

    test('disconnects RPC client on DISCONNECT message', () => {
      return sendConnect()
        .then(() => sendDisconnect())
        .then(() => expect(rpcClient.close).toHaveBeenCalled())
    })

    test('dispatch DISCONNECT_RESPONSE if rpcClient closes', () => {
      const expected = actions.disconnectResponse()
      let emitDisconnect

      return sendConnect()
        .then(() => {
          emitDisconnect = rpcClient.on.mock.calls.find((args) => (
            args[0] === 'close'
          ))[1]
          expect(typeof emitDisconnect).toBe('function')
        })
        .then(() => sendDisconnect())
        .then(() => emitDisconnect())
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('dispatch DISCONNECT_RESPONSE w/ alert if unexpected close', () => {
      const expected = tagAlertAction(
        actions.disconnectResponse(),
        expect.stringMatching(/unexpected/i)
      )
      let emitDisconnect

      return sendConnect()
        .then(() => {
          emitDisconnect = rpcClient.on.mock.calls.find((args) => (
            args[0] === 'close'
          ))[1]
          expect(typeof emitDisconnect).toBe('function')
        })
        .then(() => emitDisconnect())
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('dispatch push to /run if connect to running session', () => {
      const expected = push('/run')
      session.state = constants.RUNNING

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('dispatch push to /run if connect to paused session', () => {
      const expected = push('/run')
      session.state = constants.PAUSED

      return sendConnect()
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
        instrumentsByMount: {},
        labwareBySlot: {}
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
          3: {id: 3, description: 'd', handledAt: null, children: []},
          4: {id: 4, description: 'e', handledAt: null, children: []}
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

    test('maps api instruments and intruments by mount', () => {
      const expected = actions.sessionResponse(null, expect.objectContaining({
        instrumentsByMount: {
          left: {_id: 2, mount: 'left', name: 'p200', channels: 1, volume: 200},
          right: {_id: 1, mount: 'right', name: 'p50', channels: 8, volume: 50}
        }
      }))

      session.instruments = [
        {_id: 1, mount: 'right', name: 'p50', channels: 8},
        {_id: 2, mount: 'left', name: 'p200', channels: 1}
      ]

      return sendConnect()
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('maps api containers to labware by slot', () => {
      const expected = actions.sessionResponse(null, expect.objectContaining({
        labwareBySlot: {
          1: {_id: 1, slot: '1', name: 'a', type: 'tiprack', isTiprack: true},
          5: {_id: 2, slot: '5', name: 'b', type: 'B', isTiprack: false},
          9: {_id: 3, slot: '9', name: 'c', type: 'C', isTiprack: false}
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
          calibration: {
            confirmedBySlot: {},
            labwareBySlot: {},
            jogDistance: constants.JOG_DISTANCE_FAST_MM
          },
          session: {
            instrumentsByMount: {
              left: {_id: 'inst-2'},
              right: {_id: 'inst-1'}
            },
            labwareBySlot: {
              1: {_id: 'lab-1', type: '96-flat'},
              5: {_id: 'lab-2', type: 'tiprack-200ul', isTiprack: true},
              9: {_id: 'lab-3', type: 'tiprack-200ul', isTiprack: true}
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

    test('handles PICKUP_AND_HOME success', () => {
      const action = actions.pickupAndHome('left', 5)
      const expectedResponse = actions.pickupAndHomeResponse()

      calibrationManager.pick_up_tip.mockReturnValue(Promise.resolve())
      calibrationManager.home.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.pick_up_tip)
            .toHaveBeenCalledWith({_id: 'inst-2'}, {_id: 'lab-2'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles PICKUP_AND_HOME failure during pickup', () => {
      const action = actions.pickupAndHome('left', 5)
      const expectedResponse = actions.pickupAndHomeResponse(new Error('AH'))

      calibrationManager.pick_up_tip
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles DROP_TIP_AND_HOME success', () => {
      const action = actions.dropTipAndHome('right', 9)
      const expectedResponse = actions.dropTipAndHomeResponse()

      calibrationManager.drop_tip.mockReturnValue(Promise.resolve())
      calibrationManager.home.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.drop_tip)
            .toHaveBeenCalledWith({_id: 'inst-1'}, {_id: 'lab-3'})
          expect(calibrationManager.home).toHaveBeenCalledWith({_id: 'inst-1'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles DROP_TIP_AND_HOME failure in drop_tip', () => {
      const action = actions.dropTipAndHome('right', 9)
      const expectedResponse = actions.dropTipAndHomeResponse(new Error('AH'))

      calibrationManager.drop_tip
        .mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('handles DROP_TIP_AND_HOME failure in home', () => {
      const action = actions.dropTipAndHome('right', 9)
      const expectedResponse = actions.dropTipAndHomeResponse(new Error('AH'))

      calibrationManager.drop_tip.mockReturnValue(Promise.resolve())
      calibrationManager.home.mockReturnValue(Promise.reject(new Error('AH')))

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('CONFIRM_TIPRACK drops tip if not last tiprack', () => {
      const action = actions.confirmTiprack('left', 9)
      const expectedResponse = actions.confirmTiprackResponse()

      calibrationManager.drop_tip.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.drop_tip)
            .toHaveBeenCalledWith({_id: 'inst-2'}, {_id: 'lab-3'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('CONFIRM_TIPRACK noops if last tiprack', () => {
      state[NAME].calibration.confirmedBySlot[5] = true

      const action = actions.confirmTiprack('left', 9)
      const expectedResponse = actions.confirmTiprackResponse()

      calibrationManager.drop_tip.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.drop_tip).not.toHaveBeenCalled()
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles CONFIRM_TIPRACK drop tip failure', () => {
      const action = actions.confirmTiprack('left', 9)
      const expectedResponse = actions.confirmTiprackResponse(new Error('AH'))

      calibrationManager.drop_tip
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
          expect(calibrationManager.jog).toHaveBeenCalledWith(
            {_id: 'inst-2'},
            -constants.JOG_DISTANCE_FAST_MM,
            'y'
          )
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

    test('handles UPDATE_OFFSET success with labware', () => {
      const action = actions.updateOffset('left', 1)
      const expectedResponse = actions.updateOffsetResponse(null, false)

      calibrationManager.update_container_offset
        .mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.update_container_offset)
            .toHaveBeenCalledWith({_id: 'lab-1'}, {_id: 'inst-2'})
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('handles UPDATE_OFFSET success with tiprack', () => {
      const action = actions.updateOffset('left', 9)
      const expectedResponse = actions.updateOffsetResponse(null, true)

      calibrationManager.update_container_offset
        .mockReturnValue(Promise.resolve())
      calibrationManager.pick_up_tip.mockReturnValue(Promise.resolve())
      calibrationManager.home.mockReturnValue(Promise.resolve())

      return sendConnect()
        .then(() => sendToClient(state, action))
        .then(() => {
          expect(calibrationManager.update_container_offset)
            .toHaveBeenCalledWith({_id: 'lab-3'}, {_id: 'inst-2'})
          expect(calibrationManager.pick_up_tip)
            .toHaveBeenCalledWith({_id: 'inst-2'}, {_id: 'lab-3'})
          expect(calibrationManager.home)
            .toHaveBeenCalledWith({_id: 'inst-2'})
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
