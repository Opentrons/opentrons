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
  let robotContainer
  let robot

  beforeEach(() => {
    // TODO(mc, 2017-08-29): this is a pretty nasty mock. Probably a sign we
    // need to simplify the RPC client
    // mock robot
    robot = {
      get_serial_ports_list: jest.fn(),
      commands: jest.fn()
    }

    // mock robot container
    robotContainer = {
      new_robot: jest.fn(() => Promise.resolve(robot)),
      load_protocol_file: jest.fn(() => Promise.resolve(robot))
    }

    // mock rpc client
    rpcClient = {
      on: jest.fn(() => rpcClient),
      control: {
        get_root: jest.fn(() => Promise.resolve(robotContainer))
      }
    }

    dispatch = jest.fn()
    receive = client(dispatch)
    RpcClient.mockImplementation(() => Promise.resolve(rpcClient))
  })

  afterEach(() => {
    RpcClient.mockReset()
  })

  describe('connect', () => {
    test('connect RpcClient on CONNECT message', () => {
      expect(RpcClient).toHaveBeenCalledTimes(0)
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(RpcClient).toHaveBeenCalledTimes(1))
    })

    test('dispatch CONNECT_RESPONSE once client has serial list', () => {
      const expectedResponse = actions.connectResponse()

      robot.get_serial_ports_list
        .mockReturnValueOnce(Promise.resolve(['/dev/tty.usbserial']))

      receive({}, actions.connect())

      return delay(1)
        .then(() => {
          expect(robot.get_serial_ports_list).toHaveBeenCalled()
          expect(dispatch).toHaveBeenCalledWith(expectedResponse)
        })
    })

    test('dispatch CONNECT_RESPONSE error if get_root fails', () => {
      const error = new Error('AHH get_root')
      const expectedResponse = actions.connectResponse(error)

      rpcClient.control.get_root.mockReturnValueOnce(Promise.reject(error))
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('dispatch CONNECT_RESPONSE error if new_robot fails', () => {
      const error = new Error('AHH new_robot')
      const expectedResponse = actions.connectResponse(error)

      robotContainer.new_robot.mockReturnValueOnce(Promise.reject(error))
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })

    test('dispatch CONNECT_RESPONSE error if get_serial... fails', () => {
      const error = new Error('AHH get_serial_ports_list')
      const expectedResponse = actions.connectResponse(error)

      robot.get_serial_ports_list.mockReturnValueOnce(Promise.reject(error))
      receive({}, actions.connect())

      return delay(1)
        .then(() => expect(dispatch).toHaveBeenCalledWith(expectedResponse))
    })
  })

  describe('load protocol', () => {
    beforeEach(() => {
      receive({}, actions.connect())
      return delay(1)
    })

    test('load protocol success', () => {
      const commands = ['foo', 'bar', 'baz']

      robot.commands.mockReturnValueOnce(Promise.resolve(commands))
      receive({robot: {protocol: 'foo.py'}}, actions.loadProtocol())

      return delay(1)
        .then(() => {
          expect(robotContainer.load_protocol_file)
            .toHaveBeenCalledWith('foo.py')
          expect(dispatch)
            .toHaveBeenCalledWith(actions.setCommands(commands))
        })
    })
  })

  describe('run protocol', () => {

  })
})
