// tests for generic api reducer
import { apiReducer } from '../reducer'

describe('apiReducer', () => {
  it('handles api:REQUEST', () => {
    const emptyState = {}
    const oldRequestState = {
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: false,
          request: {},
          response: { baz: 'qux' },
          error: new Error('AH'),
        },
      },
    }

    const action = {
      type: 'api:REQUEST',
      payload: {
        robot: { name: 'name' },
        path: 'path',
        request: { foo: 'bar' },
      },
    }

    expect(apiReducer(emptyState, action)).toEqual({
      name: {
        path: { inProgress: true, request: { foo: 'bar' }, error: null },
      },
    })

    expect(apiReducer(oldRequestState, action)).toEqual({
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: true,
          request: { foo: 'bar' },
          response: { baz: 'qux' },
          error: null,
        },
      },
    })
  })

  it('handles api:SUCCESS', () => {
    const emptyState = {}
    const oldRequestState = {
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: true,
          request: { foo: 'bar' },
          response: { fizz: 'buzz' },
          error: new Error('AH'),
        },
      },
    }

    const action = {
      type: 'api:SUCCESS',
      payload: {
        robot: { name: 'name' },
        path: 'path',
        response: { baz: 'qux' },
      },
    }

    expect(apiReducer(emptyState, action)).toEqual({
      name: {
        path: { inProgress: false, response: { baz: 'qux' }, error: null },
      },
    })

    expect(apiReducer(oldRequestState, action)).toEqual({
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: false,
          request: { foo: 'bar' },
          response: { baz: 'qux' },
          error: null,
        },
      },
    })
  })

  it('handles api:FAILURE', () => {
    const state = {
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: true,
          request: { foo: 'bar' },
          response: { baz: 'qux' },
          error: null,
        },
      },
    }

    const action = {
      type: 'api:FAILURE',
      payload: {
        robot: { name: 'name' },
        path: 'path',
        error: new Error('AH'),
      },
    }

    expect(apiReducer(state, action)).toEqual({
      name: {
        otherPath: { inProgress: false },
        path: {
          inProgress: false,
          request: { foo: 'bar' },
          response: { baz: 'qux' },
          error: new Error('AH'),
        },
      },
    })
  })

  it('api:FAILURE noops if no inProgress state', () => {
    const state = { name: { path: { inProgress: false } } }

    const action = {
      type: 'api:FAILURE',
      payload: {
        robot: { name: 'name' },
        path: 'path',
        error: new Error('AH'),
      },
    }

    expect(apiReducer(state, action)).toEqual(state)
  })

  it('clears state for unhealthy robots on discovery:UPDATE_LIST', () => {
    const robots = [
      { name: 'offline', ok: false, serverOk: false, advertising: false },
      { name: 'advertising', ok: false, serverOk: false, advertising: true },
      { name: 'reachable', ok: false, serverOk: true, advertising: false },
      { name: 'connectable', ok: true, serverOk: false, advertising: false },
    ]
    const state = {
      offline: { path: { inProgress: false, error: new Error('AH') } },
      advertising: { path: { inProgress: false, error: new Error('AH') } },
      reachable: { path: { inProgress: false, error: new Error('AH') } },
      connectable: { path: { inProgress: false, error: new Error('AH') } },
    }
    const action = { type: 'discovery:UPDATE_LIST', payload: { robots } }

    expect(apiReducer(state, action)).toEqual({
      offline: {},
      advertising: { path: { inProgress: false, error: new Error('AH') } },
      reachable: { path: { inProgress: false, error: new Error('AH') } },
      connectable: { path: { inProgress: false, error: new Error('AH') } },
    })
  })
})
