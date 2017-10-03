// tests for the api client
import {delay} from '../../util'
import client from '../api-client/client'
import RpcClient from '../../../rpc/client'
import {actions} from '../'

import MockRobot from './__mocks__/robot'
import MockSession from './__mocks__/session'

jest.mock('../../../rpc/client')

describe('api client', () => {
  let dispatch
  let sendToClient
  let rpcClient
  let robot
  let session
  let sessionManager

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
    robot = MockRobot()
    session = MockSession()

    // mock rpc client
    sessionManager = {robot, session}
    rpcClient = {
      // TODO(mc, 2017-09-22): these jest promise mocks are causing promise
      // rejection warnings. These warnings are Jest's fault for nextTick stuff
      // http://clarkdave.net/2016/09/node-v6-6-and-asynchronously-handled-promise-rejections/
      on: jest.fn(() => rpcClient),
      close: jest.fn(),
      remote: {
        session_manager: sessionManager
      }
    }

    dispatch = jest.fn()
    RpcClient.mockImplementation(() => Promise.resolve(rpcClient))

    const _receive = client(dispatch)

    sendToClient = (state, action) => {
      _receive(state, action)
      return delay(1)
    }
  })

  afterEach(() => {
    RpcClient.mockReset()
  })

  const sendConnect = (state = {}) => sendToClient(state, actions.connect())
  const sendDisconnect = (state = {}) => sendToClient(state, actions.disconnect())

  describe('connect and disconnect', () => {
    test('connect RpcClient on CONNECT message', () => {
      expect(RpcClient).toHaveBeenCalledTimes(0)

      return sendConnect()
        .then(() => expect(RpcClient).toHaveBeenCalledTimes(1))
    })

    // TODO(mc, 2017-09-06): remove when server handles serial port
    test('dispatch CONNECT_RESPONSE once client has serial list', () => {
      const expectedResponse = actions.connectResponse()

      robot.get_serial_ports_list = jest.fn()
        .mockReturnValueOnce(Promise.resolve(['/dev/tty.usbserial']))

      return sendConnect()
        .then(() => {
          expect(robot.get_serial_ports_list).toHaveBeenCalled()
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

    // TODO(mc, 2017-09-06): remove when server handles serial port
    test('dispatch CONNECT_RESPONSE error if get_serial... fails', () => {
      const error = new Error('AHH get_serial_ports_list')
      const expectedResponse = actions.connectResponse(error)

      robot.get_serial_ports_list = jest.fn()
        .mockReturnValueOnce(Promise.reject(error))

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
      return sendConnect()
        .then(() => sendToClient({}, actions.run()))
        .then(() => expect(global.setInterval).toHaveBeenCalled())
    })
  })
})
