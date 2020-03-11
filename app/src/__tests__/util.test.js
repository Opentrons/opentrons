// utility function tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { chainActions } from '../util'

jest.mock('../logger')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('chainActions utility', () => {
  let state
  let store

  beforeEach(() => {
    state = {}
    store = mockStore(state)
  })

  it('dispatches a chain of plain actions', () => {
    const actions = [{ type: 'foo' }, { type: 'bar' }, { type: 'baz' }]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(actions[2])
      expect(store.getActions()).toEqual(actions)
    })
  })

  it('dispatches a chain of thunk actions', () => {
    const actions = [{ type: 'foo' }, { type: 'bar' }, { type: 'baz' }]
    const thunks = actions.map(a => dispatch => dispatch(a))

    return store.dispatch(chainActions(...thunks)).then(result => {
      expect(result).toEqual(actions[2])
      expect(store.getActions()).toEqual(actions)
    })
  })

  it('dispatches a chain of thunk promise actions', () => {
    const actions = [{ type: 'foo' }, { type: 'bar' }, { type: 'baz' }]
    const thunks = actions.map(a => dispatch => Promise.resolve(dispatch(a)))

    return store.dispatch(chainActions(...thunks)).then(result => {
      expect(result).toEqual(actions[2])
      expect(store.getActions()).toEqual(actions)
    })
  })

  it('dispatches a combination of action types', () => {
    const actions = [{ type: 'foo' }, { type: 'bar' }, { type: 'baz' }]
    const thunks = [
      dispatch => dispatch(actions[0]),
      dispatch => Promise.resolve(dispatch(actions[1])),
      actions[2],
    ]

    return store.dispatch(chainActions(...thunks)).then(result => {
      expect(result).toEqual(actions[2])
      expect(store.getActions()).toEqual(actions)
    })
  })

  it('bails out early if a plain action has an error', () => {
    const actions = [{ type: 'foo', error: new Error('AH') }, { type: 'bar' }]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(actions[0])
      expect(store.getActions()).toEqual(actions.slice(0, 1))
    })
  })

  it('bails out early if a thunk action has an error', () => {
    const errorAction = { type: 'foo', error: new Error('AH') }
    const actions = [dispatch => dispatch(errorAction), { type: 'bar' }]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(errorAction)
      expect(store.getActions()).toEqual([errorAction])
    })
  })

  it('bails out early if a thunk promise has an error', () => {
    const errorAction = { type: 'foo', error: new Error('AH') }
    const actions = [
      dispatch => Promise.resolve(dispatch(errorAction)),
      { type: 'bar' },
    ]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(errorAction)
      expect(store.getActions()).toEqual([errorAction])
    })
  })

  it('bails out early if a plain action has an error in the payload', () => {
    const actions = [
      { type: 'foo', payload: { error: new Error('AH') } },
      { type: 'bar' },
    ]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(actions[0])
      expect(store.getActions()).toEqual(actions.slice(0, 1))
    })
  })

  it('bails out early if a thunk action has an error in the payload', () => {
    const errorAction = { type: 'foo', payload: { error: new Error('AH') } }
    const actions = [dispatch => dispatch(errorAction), { type: 'bar' }]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(errorAction)
      expect(store.getActions()).toEqual([errorAction])
    })
  })

  it('bails out early if a thunk promise has an error in the payload', () => {
    const errorAction = { type: 'foo', payload: { error: new Error('AH') } }
    const actions = [
      dispatch => Promise.resolve(dispatch(errorAction)),
      { type: 'bar' },
    ]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(errorAction)
      expect(store.getActions()).toEqual([errorAction])
    })
  })

  it('bails out early if a thunk promise rejects', () => {
    const actions = [
      dispatch => Promise.reject(new Error('AH')),
      { type: 'bar' },
    ]

    return store.dispatch(chainActions(...actions)).then(result => {
      expect(result).toEqual(null)
      expect(store.getActions()).toEqual([])
    })
  })
})
