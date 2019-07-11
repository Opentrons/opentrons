import * as buildroot from '../buildroot'

const reducer = buildroot.buildrootReducer

describe('shell/buildroot', () => {
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
          payload: { version: '1.0.0', releaseNotes: 'release notes' },
        },
        initialState: { ...buildroot.INITIAL_STATE, info: null },
        expected: {
          ...buildroot.INITIAL_STATE,
          info: { version: '1.0.0', releaseNotes: 'release notes' },
        },
      },
      {
        name: 'handles buildroot:SET_UPDATE_SEEN',
        action: { type: 'buildroot:SET_UPDATE_SEEN' },
        initialState: { ...buildroot.INITIAL_STATE, seen: false },
        expected: { ...buildroot.INITIAL_STATE, seen: true },
      },
      {
        name: 'handles buildroot:DOWNLOAD_PROGRESS',
        action: { type: 'buildroot:DOWNLOAD_PROGRESS', payload: 42 },
        initialState: { ...buildroot.INITIAL_STATE, downloadProgress: null },
        expected: { ...buildroot.INITIAL_STATE, downloadProgress: 42 },
      },
      {
        name: 'handles buildroot:DOWNLOAD_ERROR',
        action: { type: 'buildroot:DOWNLOAD_ERROR', payload: 'AH' },
        initialState: { ...buildroot.INITIAL_STATE, downloadError: null },
        expected: { ...buildroot.INITIAL_STATE, downloadError: 'AH' },
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
