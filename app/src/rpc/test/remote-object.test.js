// RPC remote object tests
import { RemoteObject } from '../remote-object'

describe('rpc remote object factory', () => {
  let context

  beforeEach(() => {
    context = {
      resolveTypeValues: jest.fn(),
      callRemote: jest.fn(),
    }
  })

  test('deserializes an int', () => {
    return expect(RemoteObject(context, 42)).resolves.toBe(42)
  })

  test('deserializes a string', () => {
    return expect(RemoteObject(context, 'foo')).resolves.toBe('foo')
  })

  test('deserializes a bool', () => {
    return expect(RemoteObject(context, true)).resolves.toBe(true)
  })

  test('deserializes null', () => {
    return expect(RemoteObject(context, null)).resolves.toBe(null)
  })

  test('deserializes an array of primitives', () => {
    const source = [42, 'foo', true, null]
    const remote = RemoteObject(context, source)

    return expect(remote).resolves.toEqual([42, 'foo', true, null])
  })

  test('deserializes an object with primitive props', () => {
    const source = { i: 1, t: 2, v: { foo: 'bar' } }

    context.resolveTypeValues.mockReturnValueOnce(Promise.resolve({}))

    return RemoteObject(context, source).then(remote =>
      expect(remote).toEqual({ _id: 1, foo: 'bar' })
    )
  })

  test('deserializes an object with remote methods from type', () => {
    const source = { i: 1, t: 2, v: { foo: 'bar' } }
    const typeValues = { baz: {} }

    context.resolveTypeValues.mockReturnValueOnce(Promise.resolve(typeValues))
    context.callRemote.mockReturnValueOnce(Promise.resolve('call result!'))

    return RemoteObject(context, source)
      .then(remote => {
        expect(context.resolveTypeValues).toHaveBeenCalledWith(source)
        expect(remote).toEqual({
          _id: 1,
          foo: 'bar',
          baz: expect.any(Function),
        })
        return remote.baz(1, 2, 3)
      })
      .then(result => {
        expect(result).toBe('call result!')
        expect(context.callRemote).toHaveBeenCalledWith(1, 'baz', [1, 2, 3])
      })
  })

  test('deserializes an object without methods if methods: false', () => {
    const source = { i: 1, t: 2, v: { foo: 'bar' } }

    return RemoteObject(context, source, { methods: false }).then(remote => {
      expect(context.resolveTypeValues).not.toHaveBeenCalledWith(source)
      expect(remote).toEqual({ _id: 1, foo: 'bar' })
    })
  })

  test('deserializes object props as remote objects', () => {
    const child = { i: 2, t: 100, v: { baz: 'qux' } }
    const source = { i: 1, t: 100, v: { foo: 'bar', bar: child } }

    context.resolveTypeValues.mockReturnValue(Promise.resolve({}))

    return RemoteObject(context, source).then(remote => {
      expect(context.resolveTypeValues).toHaveBeenCalledWith(source)
      expect(context.resolveTypeValues).toHaveBeenCalledWith(child)
      expect(remote).toEqual({
        _id: 1,
        foo: 'bar',
        bar: { _id: 2, baz: 'qux' },
      })
    })
  })

  test('desrializes array of objects as remote', () => {
    const child1 = { i: 3, t: 100, v: { baz: 'qux' } }
    const child2 = { i: 2, t: 100, v: { fizz: 'buzz' } }
    const source = {
      i: 1,
      t: 100,
      v: { foo: 'bar', children: [child1, child2] },
    }

    context.resolveTypeValues.mockReturnValue(Promise.resolve({}))

    return RemoteObject(context, source).then(remote => {
      expect(context.resolveTypeValues).toHaveBeenCalledWith(source)
      expect(context.resolveTypeValues).toHaveBeenCalledWith(child1)
      expect(context.resolveTypeValues).toHaveBeenCalledWith(child2)
      expect(remote).toEqual({
        _id: 1,
        foo: 'bar',
        children: [{ _id: 3, baz: 'qux' }, { _id: 2, fizz: 'buzz' }],
      })
    })
  })

  test('deserializes remote object with deep matching refs', () => {
    const child = { i: 31, t: 30, v: { foo: 'foo' } }
    const childDup = { i: 31, t: 30, v: null }
    const parent1 = { i: 32, t: 30, v: { c: childDup } }
    const parent2 = { i: 33, t: 30, v: { c: child } }
    const grandparent = { i: 34, t: 30, v: { parent1, parent2 } }

    context.resolveTypeValues.mockReturnValue(Promise.resolve({}))

    return RemoteObject(context, grandparent).then(remote => {
      // only need 4 type resolutions because of childDup
      expect(context.resolveTypeValues).toHaveBeenCalledTimes(4)
      expect(remote).toEqual({
        _id: 34,
        parent1: { _id: 32, c: { _id: 31, foo: 'foo' } },
        parent2: { _id: 33, c: { _id: 31, foo: 'foo' } },
      })
    })
  })

  test('remote method object arg with _id,', () => {
    const source = { i: 1, t: 2, v: {} }
    const typeValues = { method: {} }

    context.resolveTypeValues.mockReturnValueOnce(Promise.resolve(typeValues))
    context.callRemote.mockReturnValueOnce(Promise.resolve('call result!'))

    return RemoteObject(context, source)
      .then(remote => remote.method({ _id: 'foo' }))
      .then(result =>
        expect(context.callRemote).toHaveBeenCalledWith(1, 'method', [
          { i: 'foo' },
        ])
      )
  })
})
