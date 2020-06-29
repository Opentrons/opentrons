// protocol actions tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { openProtocol } from '..'
import * as ConfigSelectors from '../../config/selectors'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

jest.mock('../../config/selectors')

describe('protocol actions', () => {
  let store
  let _FileReader
  let mockReader

  beforeEach(() => {
    _FileReader = global.FileReader
    mockReader = { readAsText: jest.fn(), readAsArrayBuffer: jest.fn() }

    store = mockStore({})
    global.FileReader = jest.fn(() => mockReader)
    ConfigSelectors.getFeatureFlags.mockReturnValue({
      enableBundleUpload: false,
    })
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
    }

    const bundleFile = {
      name: 'foobar.zip',
      type: 'zip',
      lastModified: 111,
    }

    const jsonFile = {
      name: 'foobar.json',
      type: 'json',
      lastModified: 456,
    }

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

    describe('bundle upload', () => {
      it('dispatches a protocol:OPEN', () => {
        ConfigSelectors.getFeatureFlags.mockReturnValue({
          enableBundleUpload: true,
        })
        const result = store.dispatch(openProtocol(bundleFile))
        const expected = {
          type: 'protocol:OPEN',
          payload: { file: bundleFile },
        }

        expect(result).toEqual(expected)
        expect(store.getActions()).toEqual([expected])
      })

      it('dispatches a protocol:INVALID_FILE without bundles enabled', () => {
        const result = store.dispatch(openProtocol(bundleFile))
        const expected = {
          type: 'protocol:INVALID_FILE',
          payload: {
            file: bundleFile,
            message: expect.stringMatching(
              /ZIP uploads are not currently supported/i
            ),
          },
        }

        expect(result).toEqual(expected)
        expect(store.getActions()).toEqual([expected])
      })

      it('dispatches protocol:UPLOAD on bundle read completion', () => {
        const arrayBuff = new ArrayBuffer(3)
        const uint8array = new Uint8Array(arrayBuff)
        uint8array[0] = 57
        uint8array[1] = 54
        uint8array[2] = 0

        store.dispatch(openProtocol(bundleFile))
        mockReader.result = arrayBuff
        mockReader.onload()

        const actions = store.getActions()
        expect(actions).toHaveLength(2)
        expect(actions[1]).toEqual({
          type: 'protocol:UPLOAD',
          meta: { robot: true },
          payload: { contents: 'OTYA', data: null },
        })
      })
    })
  })
})
