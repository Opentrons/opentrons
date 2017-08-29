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

  beforeEach(() => {
    rpcClient = {}
    dispatch = jest.fn()
    receive = client(dispatch)
    RpcClient.mockImplementation(() => Promise.resolve(rpcClient))
  })

  afterEach(() => {
    RpcClient.mockReset()
  })

  test('connect RPC on CONNECT message and CONNECT_RESPONSE on success', () => {
    const expectedResponse = actions.connectResponse()

    expect(RpcClient.mock.calls.length).toBe(0)
    receive({}, actions.connect())

    return delay(1)
      .then(() => {
        expect(RpcClient.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0][0]).toEqual(expectedResponse)
      })
  })

  test('connect RPC on CONNECT message and CONNECT_RESPONSE on error', () => {
    const expectedResponse = actions.connectResponse(new Error('AHHH'))

    RpcClient.mockImplementation(() => Promise.reject(new Error('AHHH')))
    receive({}, actions.connect())

    return delay(1)
      .then(() => expect(dispatch.mock.calls[0][0]).toEqual(expectedResponse))
  })
})
