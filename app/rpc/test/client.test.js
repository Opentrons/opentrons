import EventEmitter from 'events'
import portfinder from 'portfinder'
import WebSocket from 'ws'
// import log from 'winston'

import Client from '../../rpc/client'
import {
  statuses,
  RESULT,
  ACK,
  NOTIFICATION,
  CONTROL_MESSAGE
} from '../../rpc/message-types'

// log.level = 'debug'

const {SUCCESS, FAILURE} = statuses

const EX_CONTROL_DATA = {
  instance: {i: 1, t: 2, v: {server: {}}},
  type: {i: 2, t: 3, v: {get_root: {}, get_object_by_id: {}}}
}

const EX_CONTROL_MESSAGE = {
  $: {type: CONTROL_MESSAGE},
  control: EX_CONTROL_DATA
}

const EX_ROOT_INSTANCE = {i: 4, t: 5, v: {foo: 'bar'}}
const EX_ROOT_TYPE = {i: 5, t: 3, v: {be_a_robot: {}, be_a_person: {}}}

function makeAckResponse (token) {
  return {$: {type: ACK, token}}
}

function makeCallResponse (token, status, data) {
  return {$: {type: RESULT, token, status}, data}
}

describe('rpc client', () => {
  let url
  let wss
  let listeners

  function addListener (target, event, handler) {
    listeners.push({target, event, handler})
    target.on(event, handler)
  }

  function removeListener (listener) {
    const {target, event, handler} = listener

    target.removeListener(event, handler)
  }

  class JsonWs extends EventEmitter {
    constructor (ws) {
      super()
      this._ws = ws

      addListener(ws, 'message', (message) => this.emit('message', JSON.parse(message)))
      addListener(ws, 'close', () => this.emit('close'))
    }

    send (message) {
      this._ws.send(JSON.stringify(message))
    }
  }

  beforeAll((done) => portfinder.getPort((error, port) => {
    if (error) return done(error)
    if (!global.WebSocket) global.WebSocket = WebSocket

    url = `ws://127.0.0.1:${port}`
    wss = new WebSocket.Server({port})
    wss.once('listening', done)
  }))

  afterAll((done) => {
    if (global.WebSocket === WebSocket) delete global.WebSocket
    wss.close(done)
  })

  beforeEach(() => {
    listeners = []
  })

  afterEach(() => {
    listeners.forEach(removeListener)
  })

  test('rejects if control message never comes', () => {
    const result = Client(url)

    // TODO(mc): can't call .toMatch on an error
    // figure out if this is best practice for jest error checking
    return expect(result).rejects.toMatchObject({
      message: expect.stringMatching(/timeout/i)
    })
  })

  test('connects to ws server and resolves when control is received', () => {
    addListener(wss, 'connection', (ws) => new JsonWs(ws).send(EX_CONTROL_MESSAGE))

    return expect(Client(url)).resolves.toBeDefined()
  })

  test('resolves with a proxy for the control object', () => {
    addListener(wss, 'connection', (ws) => new JsonWs(ws).send(EX_CONTROL_MESSAGE))

    return expect(Client(url)).resolves.toMatchObject({
      control: {
        get_root: expect.any(Function),
        get_object_by_id: expect.any(Function)
      }
    })
  })

  describe('with good connection', () => {
    let client
    let ws

    beforeEach(() => {
      addListener(wss, 'connection', (websocket) => {
        ws = new JsonWs(websocket)
        ws.send(EX_CONTROL_MESSAGE)
      })

      return Client(url).then((c) => (client = c))
    })

    test('calls a method of a remote object', (done) => {
      addListener(ws, 'message', (message) => {
        expect(message).toEqual({
          $: {
            token: expect.anything()
          },
          id: EX_CONTROL_DATA.instance.i,
          name: 'get_object_by_id',
          args: [EX_CONTROL_DATA.instance.i]
        })

        done()
      })

      client.control.get_object_by_id(EX_CONTROL_DATA.instance.i)
    })

    test('resolves the result of the method call', () => {
      const exResponse = (token) => makeCallResponse(
        token,
        SUCCESS,
        EX_CONTROL_DATA.instance
      )

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        ws.send(makeAckResponse(token))
        setTimeout(() => ws.send(exResponse(token)), 5)
      })

      const result = client.control.get_object_by_id(EX_CONTROL_DATA.instance.i)

      return expect(result).resolves.toMatchObject({
        get_root: expect.any(Function),
        get_object_by_id: expect.any(Function)
      })
    })

    test('rejects the result of a failed method call', () => {
      const exResponse = (token) => makeCallResponse(token, FAILURE, 'ahhh')

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        ws.send(makeAckResponse(token))
        setTimeout(() => ws.send(exResponse(token)), 5)
      })

      const result = client.control.get_object_by_id(EX_CONTROL_DATA.instance.i)

      return expect(result).rejects.toMatchObject({
        message: 'ahhh'
      })
    })

    test('getss the type of an object to create a remote object', () => {
      const exInstanceResponse = (token) => makeCallResponse(
        token,
        SUCCESS,
        EX_ROOT_INSTANCE
      )

      const exTypeResponse = (token) => makeCallResponse(
        token,
        SUCCESS,
        EX_ROOT_TYPE
      )

      let messageCount = 0
      addListener(ws, 'message', (message) => {
        const token = message.$.token

        if (messageCount === 0) {
          // first message: should call get_object_by_id on EX_ROOT_INSTANCE
          // checked in previous test so no assertions here
          setTimeout(() => ws.send(makeAckResponse(token)), 1)
          setTimeout(() => ws.send(exInstanceResponse(token)), 5)
        } else if (messageCount === 1) {
          // second message should be a get_object_by_id for the type of EX_ROOT_INSTANCE
          // check that we called control.get_object_by_id properly
          expect(message).toMatchObject({
            id: EX_CONTROL_DATA.instance.i,
            name: 'get_object_by_id',
            args: [EX_ROOT_TYPE.i]
          })
          // return an ack, then return the type object
          setTimeout(() => ws.send(makeAckResponse(token)), 1)
          setTimeout(() => ws.send(exTypeResponse(token)), 5)
        }

        messageCount++
      })

      const result = client.control.get_object_by_id(EX_ROOT_INSTANCE.i)

      return expect(result).resolves.toEqual({
        foo: 'bar',
        be_a_robot: expect.any(Function),
        be_a_person: expect.any(Function)
      })
    })

    test('creates remote objects for all non-primitive children', () => {
      const EX_DEEP_TYPE_3 = {i: 11, t: 3, v: {thing_3: {}}}
      const EX_DEEP_INSTANCE_3 = {i: 10, t: 11, v: {quux: 'quux'}}

      const EX_DEEP_TYPE_2 = {i: 13, t: 3, v: {thing_2: {}}}
      const EX_DEEP_INSTANCE_2 = {
        i: 12,
        t: 13,
        v: {baz: 'baz', instance_3: EX_DEEP_INSTANCE_3}
      }

      const EX_DEEP_TYPE_1 = {i: 15, t: 3, v: {thing_1: {}}}
      const EX_DEEP_INSTANCE_1 = {i: 14, t: 15, v: {bar: 'bar'}}

      const EX_DEEP_TYPE_0 = {i: 17, t: 3, v: {thing_0: {}}}
      const EX_DEEP_INSTANCE_0 = {
        i: 16,
        t: 17,
        v: {foo: 'foo', instance_1: EX_DEEP_INSTANCE_1, instance_2: EX_DEEP_INSTANCE_2}
      }

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        // will be a bunch of control.get_object_by_id calls
        // don't care about recursion order as long as result is correct
        if (requestedId === EX_DEEP_TYPE_3.i) {
          response = EX_DEEP_TYPE_3
        } else if (requestedId === EX_DEEP_TYPE_2.i) {
          response = EX_DEEP_TYPE_2
        } else if (requestedId === EX_DEEP_TYPE_1.i) {
          response = EX_DEEP_TYPE_1
        } else if (requestedId === EX_DEEP_TYPE_0.i) {
          response = EX_DEEP_TYPE_0
        } else if (requestedId === EX_DEEP_INSTANCE_0.i) {
          response = EX_DEEP_INSTANCE_0
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      const result = client.control.get_object_by_id(EX_DEEP_INSTANCE_0.i)

      return expect(result).resolves.toEqual({
        thing_0: expect.any(Function),
        foo: 'foo',
        instance_1: {
          thing_1: expect.any(Function),
          bar: 'bar'
        },
        instance_2: {
          thing_2: expect.any(Function),
          baz: 'baz',
          instance_3: {
            thing_3: expect.any(Function),
            quux: 'quux'
          }
        }
      })
    })

    test('deserializes remote objects with nested circular references', () => {
      const CIRCULAR_TYPE = {i: 21, t: 3, v: {circle: {}}}
      const CIRCULAR_INSTANCE = {
        i: 20,
        t: 21,
        v: {foo: 'foo', self: {i: 20, t: 21, v: null}}
      }

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        if (requestedId === CIRCULAR_TYPE.i) {
          response = CIRCULAR_TYPE
        } else if (requestedId === CIRCULAR_INSTANCE.i) {
          response = CIRCULAR_INSTANCE
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      return client.control.get_object_by_id(CIRCULAR_INSTANCE.i)
        .then((remote) => expect(remote.self).toBe(remote))
    })

    test('deserializes remote object with sibling circular refs', () => {
      const TYPE = {i: 30, t: 3, v: {}}
      const CHILD_INSTANCE = {i: 31, t: 30, v: {foo: 'foo'}}
      const CIRCULAR_CHILD_INSTANCE = {i: 31, t: 30, v: null}
      const PARENT_INSTANCE = {
        i: 32,
        t: 30,
        v: {circular: CIRCULAR_CHILD_INSTANCE, child: CHILD_INSTANCE}
      }

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        if (requestedId === TYPE.i) {
          response = TYPE
        } else if (requestedId === PARENT_INSTANCE.i) {
          response = PARENT_INSTANCE
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      return client.control.get_object_by_id(PARENT_INSTANCE.i)
        .then((remote) => {
          expect(remote.circular).toBe(remote.child)
          expect(remote.child).toEqual({foo: 'foo'})
        })
    })

    test('deserializes remote object with deep matching refs', () => {
      const TYPE = {i: 30, t: 3, v: {}}
      const CHILD = {i: 31, t: 30, v: {foo: 'foo'}}
      const ALSO_CHILD = {i: 31, t: 30, v: null}
      const PARENT_1 = {i: 32, t: 30, v: {c: ALSO_CHILD}}
      const PARENT_2 = {i: 33, t: 30, v: {c: CHILD}}
      const SUPERPARENT = {i: 34, t: 30, v: {a: PARENT_1, b: PARENT_2}}

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        if (requestedId === TYPE.i) {
          response = TYPE
        } else if (requestedId === SUPERPARENT.i) {
          response = SUPERPARENT
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      return client.control.get_object_by_id(SUPERPARENT.i)
        .then((remote) => {
          expect(remote.a.c).toBe(remote.b.c)
          expect(remote.a.c).toEqual({foo: 'foo'})
        })
    })

    test('deserializes remote object with null children', () => {
      const TYPE = {i: 30, t: 3, v: {}}
      const INSTANCE = {i: 32, t: 30, v: {foo: 'bar', baz: null}}

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        if (requestedId === TYPE.i) {
          response = TYPE
        } else if (requestedId === INSTANCE.i) {
          response = INSTANCE
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      return client.control.get_object_by_id(INSTANCE.i)
        .then((remote) => expect(remote).toEqual({
          foo: 'bar',
          baz: null
        }))
    })

    test('deserializes array values', () => {
      addListener(ws, 'message', (message) => {
        const token = message.$.token

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, [1, 2, 3])), 5)
      })

      return client.control.get_object_by_id(1234)
        .then((result) => expect(result).toEqual([1, 2, 3]))
    })

    test('deserializes null values', () => {
      addListener(ws, 'message', (message) => {
        const token = message.$.token

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, null)), 5)
      })

      return client.control.get_object_by_id(1234)
        .then((result) => expect(result).toEqual(null))
    })

    test('emits notification events', (done) => {
      const TYPE = {i: 30, t: 3, v: {}}
      const INSTANCE = {i: 32, t: 30, v: {foo: 'bar', baz: 'quux'}}
      const notification = {$: {type: NOTIFICATION}, data: INSTANCE}

      addListener(ws, 'message', (message) => {
        const token = message.$.token
        const requestedId = message.args[0]
        let response

        if (requestedId === TYPE.i) {
          response = TYPE
        }

        setTimeout(() => ws.send(makeAckResponse(token)), 1)
        setTimeout(() => ws.send(makeCallResponse(token, SUCCESS, response)), 5)
      })

      setTimeout(() => ws.send(notification), 5)

      addListener(client, 'notification', (message) => {
        expect(message).toEqual({foo: 'bar', baz: 'quux'})
        done()
      })
    })

    test('closes the socket', (done) => {
      addListener(ws, 'close', done)
      client.close()
    })
  })
})
