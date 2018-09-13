// protocol actions tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import {openProtocol} from '..'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('protocol actions', () => {
  let store
  let _FileReader
  let mockReader

  beforeEach(() => {
    _FileReader = global.FileReader
    mockReader = {readAsText: jest.fn()}

    store = mockStore({})
    global.FileReader = jest.fn(() => mockReader)
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.FileReader = _FileReader
  })

  describe('openProtocol with python protocol', () => {
    const pythonFile = {
      name: 'foobar.py',
      type: 'application/x-python-code',
      lastModified: 123,
    }

    const jsonFile = {
      name: 'foobar.json',
      type: 'application/json',
      lastModified: 456,
    }

    test('dispatches a protocol:OPEN', () => {
      const result = store.dispatch(openProtocol(pythonFile))
      const expected = {
        type: 'protocol:OPEN',
        payload: {file: pythonFile},
      }

      expect(result).toEqual(expected)
      expect(store.getActions()).toEqual([expected])
    })

    test('reads a file', () => {
      store.dispatch(openProtocol(pythonFile))
      expect(mockReader.readAsText).toHaveBeenCalledWith(pythonFile)
      expect(mockReader.onload).toEqual(expect.any(Function))
    })

    test('dispatches protocol:UPLOAD on python read completion', () => {
      store.dispatch(openProtocol(pythonFile))
      mockReader.result = 'file contents'
      mockReader.onload()

      const actions = store.getActions()
      expect(actions).toHaveLength(2)
      expect(actions[1]).toEqual({
        type: 'protocol:UPLOAD',
        meta: {robot: true},
        payload: {contents: 'file contents', data: null},
      })
    })

    test('dispatches protocol:UPLOAD on JSON read completion', () => {
      const protocol = {metadata: {}}

      store.dispatch(openProtocol(jsonFile))
      mockReader.result = JSON.stringify(protocol)
      mockReader.onload()

      expect(store.getActions()[1]).toEqual({
        type: 'protocol:UPLOAD',
        meta: {robot: true},
        payload: {
          contents: mockReader.result,
          data: protocol,
        },
      })
    })
  })
})
