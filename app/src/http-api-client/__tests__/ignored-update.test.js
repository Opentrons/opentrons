// health api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchIgnoredUpdate, reducer, makeGetIgnoredUpdate, setUpdateIgnored} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const name = 'opentrons-dev'
const robot = {name, ip: '1.2.3.4', port: '1234'}
const version = {version: '1.1.1'}
const availableUpdate = '1.1.1'

describe('ignored-update', () => {
  beforeEach(() => client.__clearMock())

  test('makeGetIgnoredUpdate returns ignored version of existing robot', () => {
    const state = {
      api: {
        ignoredUpdate: {
          [name]: {
            inProgress: true,
            error: null,
            response: {version: null}
          }
        }
      }
    }

    const getIgnoredUpdate = makeGetIgnoredUpdate()

    expect(getIgnoredUpdate(state, {name})).toEqual({
      inProgress: true,
      error: null,
      response: {version: null}
    })
  })

  test('getIgnoredUpdate returns ignored version of non-robot', () => {
    const state = {
      api: {
        ignoredUpdate: {}
      }
    }

    const getIgnoredUpdate = makeGetIgnoredUpdate()

    expect(getIgnoredUpdate(state, {name})).toEqual({
      inProgress: false,
      error: null,
      response: null
    })
  })

  test('fetchIgnoredUpdate calls GET server/update/ignore', () => {
    client.__setMockResponse(version)

    return fetchIgnoredUpdate(robot)(() => {})
      .then(() => expect(client).toHaveBeenCalledWith(robot, 'GET', 'server/update/ignore'))
  })

  test('fetchIgnoredUpdate dispatches IGNORED_UPDATE_REQUEST and IGNORED_UPDATE_SUCCESS', () => {
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot}},
      {type: 'api:IGNORED_UPDATE_SUCCESS', payload: {robot, version}}
    ]

    client.__setMockResponse(version)

    return store.dispatch(fetchIgnoredUpdate(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('fetchIgnoredUpdate dispatches IGNORED_UPDATE_REQUEST and IGNORED_UPDATE_FAILURE', () => {
    const error = new Error('AH')
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot}},
      {type: 'api:IGNORED_UPDATE_FAILURE', payload: {robot, error}}
    ]

    client.__setMockError(error)

    return store.dispatch(fetchIgnoredUpdate(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('setUpdateIgnored calls POST server/update/ignore', () => {
    client.__setMockResponse(availableUpdate)
    return setUpdateIgnored(robot, availableUpdate)(() => {})
      .then(() => expect(client).toHaveBeenCalledWith(robot, 'POST', 'server/update/ignore', version))
  })

  test('setUpdateIgnored dispatches IGNORED_UPDATE_REQUEST and IGNORED_UPDATE_SUCCESS', () => {
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot, version}},
      {type: 'api:IGNORED_UPDATE_SUCCESS', payload: {robot, version}}
    ]

    client.__setMockResponse(version)

    return store.dispatch(setUpdateIgnored(robot, availableUpdate))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('setUpdateIgnored dispatches IGNORED_UPDATE_REQUEST and IGNORED_UPDATE_FAILURE', () => {
    const error = new Error('AH')
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot, version}},
      {type: 'api:IGNORED_UPDATE_FAILURE', payload: {robot, error}}
    ]

    client.__setMockError(error)

    return store.dispatch(setUpdateIgnored(robot, availableUpdate))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('reducer handles IGNORED_UPDATE_REQUEST', () => {
    const state = {
      ignoredUpdate: {
        [name]: {
          inProgress: false,
          error: new Error('AH'),
          response: {version: '3.3.3'}
        }
      }
    }
    const action = {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot}}

    expect(reducer(state, action).ignoredUpdate).toEqual({
      [name]: {
        inProgress: true,
        error: null,
        response: {version: '3.3.3'}
      }
    })
  })

  test('reducer handles IGNORED_UPDATE_SUCCESS', () => {
    const version = {version: '3.4.1'}
    const state = {
      ignoredUpdate: {
        [name]: {
          inProgress: true,
          error: null,
          response: {version: '3.3.3'}
        }
      }
    }
    const action = {type: 'api:IGNORED_UPDATE_SUCCESS', payload: {robot, version}}

    expect(reducer(state, action).ignoredUpdate).toEqual({
      [name]: {
        inProgress: false,
        error: null,
        response: {version: '3.4.1'}
      }
    })
  })

  test('reducer handles IGNORED_UPDATE_FAILURE', () => {
    const error = new Error('AH')
    const state = {
      ignoredUpdate: {
        [name]: {
          inProgress: true,
          error: null,
          response: {version: '3.3.3'}
        }
      }
    }
    const action = {type: 'api:IGNORED_UPDATE_FAILURE', payload: {robot, error}}

    expect(reducer(state, action).ignoredUpdate).toEqual({
      [name]: {
        inProgress: false,
        error,
        response: {version: '3.3.3'}
      }
    })
  })
})
