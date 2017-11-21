// tests for the analytics middleware
import gtmConfig from '../gtm-config'
import {NAME, tagAction, middleware} from '../'

const createStore = () => {
  const eventsMap = {}
  const store = {
    getState: jest.fn(() => ({state: true})),
    dispatch: jest.fn()
  }

  const next = jest.fn()
  const invoke = (action) => middleware(eventsMap)(store)(next)(action)

  return {store, next, invoke, eventsMap}
}

const dataLayer = global[gtmConfig.DATA_LAYER_NAME]

describe('analytics middleware', () => {
  beforeEach(() => {
    dataLayer.splice(0, dataLayer.length)
  })

  test('tagAction adds meta flag to action', () => {
    expect(tagAction({type: 'FOO_TYPE'})).toEqual({
      type: 'FOO_TYPE',
      meta: {[NAME]: true}
    })
  })

  test('tagAction adds meta flag to action with existing meta', () => {
    expect(tagAction({type: 'FOO_TYPE', meta: {foo: true}})).toEqual({
      type: 'FOO_TYPE',
      meta: {[NAME]: true, foo: true}
    })
  })

  test('ignores non-analytics actions', () => {
    const {next, invoke} = createStore()
    const action = {type: 'FOO'}

    invoke(action)
    expect(next).toHaveBeenCalledWith(action)
  })

  test('adds details from the events map to the data layer', () => {
    const {next, invoke, eventsMap} = createStore()
    const action = tagAction({type: 'FOO_TYPE'})

    eventsMap.FOO_TYPE = jest.fn(() => ({
      name: 'name',
      category: 'cat',
      payload: {}
    }))

    invoke(action)
    expect(next).toHaveBeenCalledWith(action)
    expect(eventsMap.FOO_TYPE).toHaveBeenCalledWith({state: true}, action)
    expect(dataLayer).toEqual([
      {
        event: 'OT_EVENT',
        action: 'name',
        category: 'cat',
        label: ''
      }
    ])
  })

  test('adds a primitive payload as a label to the dataLayer', () => {
    const {next, invoke, eventsMap} = createStore()
    const action = tagAction({type: 'FOO_TYPE'})

    eventsMap.FOO_TYPE = jest.fn(() => ({
      name: 'name',
      category: 'cat',
      payload: 'foo'
    }))

    invoke(action)
    expect(next).toHaveBeenCalledWith(action)
    expect(dataLayer).toEqual([
      {
        event: 'OT_EVENT',
        action: 'name',
        category: 'cat',
        label: 'foo'
      }
    ])
  })

  test('adds a payload object as a stringified label to the dataLayer', () => {
    const {next, invoke, eventsMap} = createStore()
    const action = tagAction({type: 'FOO_TYPE'})

    eventsMap.FOO_TYPE = jest.fn(() => ({
      name: 'name',
      category: 'cat',
      payload: {foo: 'bar', baz: 'qux', fizz: 42}
    }))

    invoke(action)
    expect(next).toHaveBeenCalledWith(action)
    expect(dataLayer).toEqual([
      {
        event: 'OT_EVENT',
        action: 'name',
        category: 'cat',
        label: 'foo=bar,baz=qux,fizz=42'
      }
    ])
  })
})
