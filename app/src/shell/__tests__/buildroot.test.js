import { mockResolvedValue } from '../../../__util__/mock-promise'
import mockRemote from '../remote'
import * as buildroot from '../buildroot'

const { buildroot: mockBuildrootUpdate } = mockRemote

const reducer = buildroot.buildrootReducer

describe('shell/buildroot', () => {
  let _Blob

  beforeEach(() => {
    _Blob = global.Blob
    global.Blob = jest.fn(input => ({ blob: input }))
  })

  afterEach(() => {
    global.Blob = _Blob
    jest.clearAllMocks()
  })

  test('getBuildrootUpdateContents puts file from app-shell into a Blob', () => {
    const contents = 'update'

    mockResolvedValue(mockBuildrootUpdate.getUpdateFileContents, contents)

    return expect(buildroot.getBuildrootUpdateContents()).resolves.toEqual({
      blob: ['update'],
    })
  })

  describe('action creators', () => {
    const SPECS = [
      {
        name: 'buildroot:SET_UPDATE_SEEN',
        creator: buildroot.setBuildrootUpdateSeen,
        args: [],
        expected: { type: 'buildroot:SET_UPDATE_SEEN' },
      },
    ]
    SPECS.forEach(spec => {
      const { name, creator, args, expected } = spec
      test(name, () => expect(creator(...args)).toEqual(expected))
    })
  })

  describe('reducer', () => {
    const SPECS = [
      {
        name: 'handles buildroot:UPDATE_INFO',
        action: {
          type: 'buildroot:UPDATE_INFO',
          payload: {
            filename: 'foobar.zip',
            apiVersion: '1.0.0',
            serverVersion: '1.0.0',
          },
        },
        initialState: { info: null, seen: false },
        expected: {
          info: {
            filename: 'foobar.zip',
            apiVersion: '1.0.0',
            serverVersion: '1.0.0',
          },
          seen: false,
        },
      },
      {
        name: 'handles buildroot:SET_UPDATE_SEEN',
        action: { type: 'buildroot:SET_UPDATE_SEEN' },
        initialState: { info: null, seen: false },
        expected: { info: null, seen: true },
      },
    ]
    SPECS.forEach(spec => {
      const { name, action, initialState, expected } = spec
      test(name, () => expect(reducer(initialState, action)).toEqual(expected))
    })
  })

  describe('selectors', () => {
    const SPECS = [
      {
        name: 'getBuildrootUpdateInfo',
        selector: buildroot.getBuildrootUpdateInfo,
        state: {
          shell: {
            buildroot: {
              info: {
                filename: 'foobar.zip',
                apiVersion: '1.0.0',
                serverVersion: '1.0.0',
              },
            },
          },
        },
        expected: {
          filename: 'foobar.zip',
          apiVersion: '1.0.0',
          serverVersion: '1.0.0',
        },
      },
      {
        name: 'getBuildrootUpdateSeen',
        selector: buildroot.getBuildrootUpdateSeen,
        state: {
          shell: {
            seen: false,
          },
        },
        expected: false,
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, expected } = spec
      test(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
