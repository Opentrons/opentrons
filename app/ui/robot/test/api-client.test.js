// tests for the api client
import {delay} from '../../util'
import client from '../api-client/client'
import RpcClient from '../../../rpc/client'
import {actions} from '../'

jest.mock('../../../rpc/client')

describe('api client', () => {
  let dispatch
  let receive
  let rpcClient
  let robot
  // let session
  let sessionManager

  // TODO(mc, 2017-09-14): build or pull in a proper FileReader Jest mock
  // let _oldFileReader
  // beforeAll(() => {
  //   if (global.FileReader) {
  //     _oldFileReader = global.FileReader
  //   }
  //
  //   global.FileReader = jest.fn()
  // })
  //
  // afterAll(() => {
  //   if (_oldFileReader) {
  //     global.FileReader = _oldFileReader
  //   } else {
  //     delete global.FileReader
  //   }
  // })

  beforeEach(() => {
    // TODO(mc, 2017-08-29): this is a pretty nasty mock. Probably a sign we
    // need to simplify the RPC client
    // mock robot, session, and session manager
    robot = {
      // TODO(mc, 2017-09-07): remove when server handles serial port
      get_serial_ports_list: jest.fn(() => Promise.resolve(['/dev/tty.USB0']))
    }
    // session = {}
    sessionManager = {robot}

    // mock rpc client
    rpcClient = {
      on: jest.fn(() => rpcClient),
      close: jest.fn(),
      remote: sessionManager
    }

    dispatch = jest.fn()
    receive = client(dispatch)
    RpcClient.mockImplementation(() => Promise.resolve(rpcClient))
  })

  afterEach(() => {
    RpcClient.mockReset()
  })

  describe('connect and disconnect', () => {
    test('connect RpcClient on CONNECT message', () => {
      expect(RpcClient).toHaveBeenCalledTimes(0)
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(RpcClient).toHaveBeenCalledTimes(1))
    })

    // TODO(mc, 2017-09-06): remove when server handles serial port
    test('dispatch CONNECT_RESPONSE once client has serial list', () => {
      const expectedResponse = actions.connectResponse()

      robot.get_serial_ports_list = jest.fn()
        .mockReturnValueOnce(Promise.resolve(['/dev/tty.usbserial']))

      receive({}, actions.connect())

      return delay(1)
        .then(() => {
          expect(robot.get_serial_ports_list).toHaveBeenCalled()
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('dispatch CONNECT_RESPONSE error if connection fails', () => {
      const error = new Error('AHH get_root')
      const expectedResponse = actions.connectResponse(error)

      RpcClient.mockReturnValueOnce(Promise.reject(error))
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    // TODO(mc, 2017-09-06): remove when server handles serial port
    test('dispatch CONNECT_RESPONSE error if get_serial... fails', () => {
      const error = new Error('AHH get_serial_ports_list')
      const expectedResponse = actions.connectResponse(error)

      robot.get_serial_ports_list = jest.fn()
        .mockReturnValueOnce(Promise.reject(error))

      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('dispatch DISCONNECT_RESPONSE if already disconnected', () => {
      const expected = actions.disconnectResponse()

      receive({}, actions.disconnect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('disconnect RPC on DISCONNECT message', () => {
      const expected = actions.disconnectResponse()

      rpcClient.close.mockReturnValueOnce(Promise.resolve())
      receive({}, actions.connect())

      return delay(1)
        .then(() => receive({}, actions.disconnect()))
        .then(() => delay(1))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })

    test('dispatch DISCONNECT_RESPONSE if close errors', () => {
      const expected = actions.disconnectResponse(new Error('AH'))

      rpcClient.close.mockReturnValueOnce(Promise.reject(new Error('AH')))
      receive({}, actions.connect())

      return delay(1)
        .then(() => receive({}, actions.disconnect()))
        .then(() => delay(1))
        .then(() => expect(dispatch).toHaveBeenCalledWith(expected))
    })
  })
})
