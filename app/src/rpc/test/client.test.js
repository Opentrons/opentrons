// RPC client tests
import util from 'util'
import EventEmitter from 'events'
import portfinder from 'portfinder'
import WS from 'ws'

import { Client } from '../client'
import { RemoteObject } from '../remote-object'
import {
  statuses,
  RESULT,
  ACK,
  NACK,
  NOTIFICATION,
  CONTROL_MESSAGE,
} from '../../rpc/message-types'

jest.mock('../remote-object')

const { SUCCESS, FAILURE } = statuses

const MOCK_REMOTE = {
  foo: 'bar',
  be_a_robot: jest.fn(),
  be_a_person: jest.fn(),
}
const REMOTE = { i: 4, t: 5, v: { foo: 'bar' } }
const REMOTE_TYPE = { i: 5, t: 3, v: { be_a_robot: {}, be_a_person: {} } }
const CONTROL = {
  $: { type: CONTROL_MESSAGE },
  root: REMOTE,
  type: REMOTE_TYPE,
}

const makeAckResponse = token => ({ $: { type: ACK, token } })
const makeNackResponse = (token, reason) => ({
  $: { type: NACK, token },
  reason,
})
const makeCallResponse = (token, status, data) => ({
  $: { type: RESULT, token, status },
  data,
})

const waitAndTry = (delay, handler) =>
  util.promisify(done => {
    setTimeout(() => {
      try {
        handler()
        done()
      } catch (e) {
        done(e)
      }
    }, delay)
  })

describe('rpc client', () => {
  let url
  let wss
  let ws
  let listeners

  function addListener(target, event, handler) {
    listeners.push({ target, event, handler })
    target.on(event, handler)
  }

  function removeListener(listener) {
    listener.target.removeListener(listener.event, listener.handler)
  }

  class JsonWs extends EventEmitter {
    constructor(ws) {
      super()
      this._ws = ws

      addListener(ws, 'message', m => this.emit('message', JSON.parse(m)))
      addListener(ws, 'close', () => this.emit('close'))
    }

    send(message) {
      this._ws.send(JSON.stringify(message))
    }

    get readyState() {
      return this._ws.readyState
    }
  }

  beforeAll(done =>
    portfinder.getPort((error, port) => {
      if (error) return done(error)
      if (!global.WebSocket) global.WebSocket = WS

      url = `ws://127.0.0.1:${port}`
      wss = new WS.Server({ port })
      wss.once('listening', done)
    })
  )

  afterAll(done => {
    if (global.WebSocket === WS) delete global.WebSocket
    wss.close(done)
  })

  beforeEach(() => {
    jest.useRealTimers()
    listeners = []
  })

  afterEach(() => {
    listeners.forEach(removeListener)
    jest.clearAllTimers()
  })

  function sendControlAndResolveRemote(handleMessage) {
    addListener(wss, 'connection', socket => {
      ws = new JsonWs(socket)

      if (handleMessage) addListener(ws, 'message', handleMessage)

      ws.send(CONTROL)
    })

    RemoteObject.mockReturnValueOnce(Promise.resolve(MOCK_REMOTE))
  }

  it('rejects if control message never comes', () => {
    jest.useFakeTimers()

    const result = Client(url)

    jest.runAllTimers()
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000)

    return expect(result).rejects.toMatchObject({
      message: expect.stringMatching(/timeout/i),
    })
  })

  it('connects to ws server and resolves when control is received', () => {
    sendControlAndResolveRemote()

    return Client(url).then(client => {
      expect(client.remote).toBe(MOCK_REMOTE)
      expect(RemoteObject).toHaveBeenCalledWith(client, REMOTE)
    })
  })

  describe('callRemote', () => {
    const id = 123
    const name = 'method_name'
    const args = [1, 2, 3]

    it('calls remote methods and wraps result in RemoteObject', () => {
      const mockRemote = { i: 42, t: 43, v: {} }
      const mockResult = { foo: 'bar' }
      const expectedMessage = {
        $: { token: expect.anything() },
        id,
        name,
        args,
      }
      let client
      let callMessage

      sendControlAndResolveRemote(message => {
        const token = message.$.token

        callMessage = message
        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => {
          ws.send(makeCallResponse(token, SUCCESS, mockRemote))
        }, 5)
      })

      return Client(url)
        .then(c => {
          client = c
          RemoteObject.mockReturnValueOnce(Promise.resolve(mockResult))
          return client.callRemote(id, name, args)
        })
        .then(result => {
          expect(callMessage).toEqual(expectedMessage)
          expect(RemoteObject).toHaveBeenCalledWith(client, mockRemote)
          expect(result).toEqual(mockResult)
        })
    })

    it('rejects if call nacks', () => {
      sendControlAndResolveRemote(message => {
        const token = message.$.token
        setTimeout(() => ws.send(makeNackResponse(token, 'You done messed up')))
      })

      return expect(
        Client(url).then(client => client.callRemote(id, name, args))
      ).rejects.toMatchObject({
        message: expect.stringMatching(/NACK.+You done messed up/),
      })
    })

    it('rejects if client errors during call', () => {
      sendControlAndResolveRemote(message => {
        const token = message.$.token
        const nack = makeNackResponse(token, 'You done messed up')
        setTimeout(() => ws.send(nack), 1)
      })

      const call = Client(url).then(client => {
        const result = client.callRemote(id, name, args)
        setTimeout(() => client.emit('error', new Error('OH NO')), 1)
        return result
      })

      return expect(call).rejects.toMatchObject({
        message: expect.stringMatching(/OH NO/),
      })
    })

    it('rejects if call is unsuccessful (string response)', () => {
      sendControlAndResolveRemote(message => {
        const token = message.$.token
        const ack = makeAckResponse(token)
        const result = makeCallResponse(token, FAILURE, 'ahhh')
        setTimeout(() => ws.send(ack), 1)
        setTimeout(() => ws.send(result), 5)
      })

      return expect(
        Client(url).then(client => client.callRemote(id, name, args))
      ).rejects.toMatchObject({
        message: expect.stringMatching(/ahhh/),
      })
    })

    it('rejects if call is unsuccessful (object response)', () => {
      sendControlAndResolveRemote(message => {
        const token = message.$.token
        const ack = makeAckResponse(token)
        const result = makeCallResponse(token, FAILURE, { message: 'ahhh' })
        setTimeout(() => ws.send(ack), 1)
        setTimeout(() => ws.send(result), 5)
      })

      return expect(
        Client(url).then(client => client.callRemote(id, name, args))
      ).rejects.toMatchObject({
        message: expect.stringMatching(/ahhh/),
      })
    })
  })

  describe('resolveTypeValues', () => {
    it('resolves cached type objects', () => {
      sendControlAndResolveRemote()

      return Client(url)
        .then(client => client.resolveTypeValues(REMOTE))
        .then(values => expect(values).toEqual(REMOTE_TYPE.v))
    })

    it('resolves empty object for type types', () => {
      sendControlAndResolveRemote()

      return Client(url)
        .then(client => client.resolveTypeValues(REMOTE_TYPE))
        .then(values => expect(values).toEqual({}))
    })

    it('calls get object by id for unknown type objects', () => {
      const instance = { i: 42, t: 101, v: { bar: 'baz' } }
      const type = { i: 101, t: 3, v: { baz: {} } }
      const expectedMessage = {
        $: { token: expect.anything() },
        id: null,
        name: 'get_object_by_id',
        args: [type.i],
      }

      let client
      let getObjectByIdCall

      sendControlAndResolveRemote(message => {
        const token = message.$.token

        getObjectByIdCall = message
        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, type)), 5)
      })

      return Client(url)
        .then(c => {
          client = c
          RemoteObject.mockReturnValueOnce(Promise.resolve(type.v))
          return client.resolveTypeValues(instance)
        })
        .then(typeValues => {
          expect(getObjectByIdCall).toEqual(expectedMessage)
          expect(RemoteObject).toHaveBeenCalledWith(client, type)
          expect(typeValues).toEqual(type.v)
        })
    })

    it('will not ask for a type object more than once', () => {
      const instance = { i: 42, t: 101, v: { bar: 'baz' } }
      const type = { i: 101, t: 3, v: { baz: {} } }
      let remoteCalls = 0
      let client

      sendControlAndResolveRemote(message => {
        const token = message.$.token

        remoteCalls++
        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, type)), 5)
      })

      return Client(url)
        .then(c => {
          client = c
          RemoteObject.mockReturnValue(Promise.resolve(type.v))
          return client.resolveTypeValues(instance)
        })
        .then(() => client.resolveTypeValues(instance))
        .then(() => expect(remoteCalls).toBe(1))
    })
  })

  it('emits notification data wrapped in RemoteObjects', () => {
    const INSTANCE = { i: 32, t: 30, v: { foo: 'bar', baz: 'qux' } }
    const notification = { $: { type: NOTIFICATION }, data: INSTANCE }
    const mockRemote = { foo: 'bar', baz: 'qux' }

    return new Promise(resolve => {
      sendControlAndResolveRemote()
      RemoteObject.mockReturnValue(Promise.resolve(mockRemote))

      Client(url).then(client => {
        addListener(client, 'notification', message => {
          expect(RemoteObject).toHaveBeenCalledWith(client, INSTANCE, {
            methods: false,
          })
          expect(message).toEqual(mockRemote)
          resolve()
        })

        setTimeout(() => ws.send(notification), 10)
      })
    })
  })

  it('closes the socket', () => {
    sendControlAndResolveRemote()

    return Client(url)
      .then(client => client.close())
      .then(() =>
        waitAndTry(100, () =>
          expect(
            ws.readyState === global.WebSocket.CLOSING ||
              ws.readyState === global.WebSocket.CLOSED
          ).toBe(true)
        )
      )
  })
})
