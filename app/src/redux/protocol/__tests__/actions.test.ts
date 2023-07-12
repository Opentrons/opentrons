// protocol actions tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { openProtocol } from '..'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('protocol actions', () => {
  let store: any
  let _FileReader: any
  let mockReader: any

  beforeEach(() => {
    _FileReader = global.FileReader
    mockReader = { readAsText: jest.fn(), readAsArrayBuffer: jest.fn() }

    store = mockStore({})
    // @ts-expect-error(sa, 2021-6-28): not a valid FileReader interface
    global.FileReader = jest.fn(() => mockReader)
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.FileReader = _FileReader
  })

  describe('openProtocol with python protocol', () => {
    const pythonFile = {
      name: 'foobar.py',
      type: 'python',
      lastModified: 123,
    } as any

    const jsonFile = {
      name: 'foobar.json',
      type: 'json',
      lastModified: 456,
    } as any

    it('dispatches a protocol:OPEN', () => {
      const result = store.dispatch(openProtocol(pythonFile))
      const expected = {
        type: 'protocol:OPEN',
        payload: { file: pythonFile },
      }

      expect(result).toEqual(expected)
      expect(store.getActions()).toEqual([expected])
    })

    it('reads a file', () => {
      store.dispatch(openProtocol(pythonFile))
      expect(mockReader.readAsText).toHaveBeenCalledWith(pythonFile)
      expect(mockReader.onload).toEqual(expect.any(Function))
    })

    it('dispatches protocol:UPLOAD on python read completion', () => {
      store.dispatch(openProtocol(pythonFile))
      mockReader.result = 'file contents'
      mockReader.onload()

      const actions = store.getActions()
      expect(actions).toHaveLength(2)
      expect(actions[1]).toEqual({
        type: 'protocol:UPLOAD',
        meta: { robot: true },
        payload: { contents: 'file contents', data: null },
      })
    })

    it('dispatches protocol:UPLOAD on JSON read completion', () => {
      const protocol = { metadata: {} }

      store.dispatch(openProtocol(jsonFile))
      mockReader.result = JSON.stringify(protocol)
      mockReader.onload()

      expect(store.getActions()[1]).toEqual({
        type: 'protocol:UPLOAD',
        meta: { robot: true },
        payload: {
          contents: mockReader.result,
          data: protocol,
        },
      })
    })
  })
})
