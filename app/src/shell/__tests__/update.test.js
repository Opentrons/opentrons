// shell/update tests

import * as ShellUpdate from '../update'
import { shellUpdateReducer } from '../reducer'

describe('shell/update', () => {
  describe('action creators', () => {
    const SPECS = [
      {
        name: 'shell:CHECK_UPDATE',
        creator: ShellUpdate.checkShellUpdate,
        args: [],
        expected: { type: 'shell:CHECK_UPDATE', meta: { shell: true } },
      },
      {
        name: 'shell:DOWNLOAD_UPDATE',
        creator: ShellUpdate.downloadShellUpdate,
        args: [],
        expected: { type: 'shell:DOWNLOAD_UPDATE', meta: { shell: true } },
      },
      {
        name: 'shell:APPLY_UPDATE',
        creator: ShellUpdate.applyShellUpdate,
        args: [],
        expected: { type: 'shell:APPLY_UPDATE', meta: { shell: true } },
      },
      {
        name: 'shell:SET_UPDATE_SEEN',
        creator: ShellUpdate.setShellUpdateSeen,
        args: [],
        expected: { type: 'shell:SET_UPDATE_SEEN' },
      },
    ]

    SPECS.forEach(spec => {
      const { name, creator, args, expected } = spec
      it(name, () => expect(creator(...args)).toEqual(expected))
    })
  })

  describe('reducer', () => {
    const SPECS = [
      {
        name: 'handles shell:CHECK_UPDATE',
        action: { type: 'shell:CHECK_UPDATE' },
        initialState: { checking: false, error: { message: 'AH' } },
        expected: { checking: true, error: null },
      },
      {
        name: 'handles shell:CHECK_UPDATE_RESULT with info',
        action: {
          type: 'shell:CHECK_UPDATE_RESULT',
          payload: { available: true, info: { version: '1.0.0' } },
        },
        initialState: { checking: true, available: false, info: null },
        expected: {
          checking: false,
          available: true,
          info: { version: '1.0.0' },
        },
      },
      {
        name: 'handles shell:CHECK_UPDATE_RESULT with error',
        action: {
          type: 'shell:CHECK_UPDATE_RESULT',
          payload: { error: { message: 'AH' } },
        },
        initialState: { checking: true, error: null },
        expected: { checking: false, error: { message: 'AH' } },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE',
        action: { type: 'shell:DOWNLOAD_UPDATE' },
        initialState: {
          downloading: false,
          seen: false,
          error: { message: 'AH' },
        },
        expected: { downloading: true, seen: true, error: null },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE_RESULT without error',
        action: {
          type: 'shell:DOWNLOAD_UPDATE_RESULT',
          payload: {},
        },
        initialState: { downloading: true, error: null },
        expected: { downloading: false, downloaded: true, error: null },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE_RESULT with error',
        action: {
          type: 'shell:DOWNLOAD_UPDATE_RESULT',
          payload: { error: { message: 'AH' } },
        },
        initialState: { downloading: true, error: null },
        expected: {
          downloading: false,
          downloaded: false,
          error: { message: 'AH' },
        },
      },
      {
        name: 'handles shell:SET_UPDATE_SEEN',
        action: { type: 'shell:SET_UPDATE_SEEN' },
        initialState: { seen: false, error: { message: 'AH' } },
        expected: { seen: true, error: null },
      },
    ]

    SPECS.forEach(spec => {
      const { name, action, initialState, expected } = spec
      it(name, () =>
        expect(shellUpdateReducer(initialState, action)).toEqual(expected)
      )
    })
  })

  describe('selectors', () => {
    const SPECS = [
      {
        name: 'getAvailableShellUpdate with nothing available',
        selector: ShellUpdate.getAvailableShellUpdate,
        state: {
          shell: { update: { available: false, info: { version: '1.0.0' } } },
        },
        expected: null,
      },
      {
        name: 'getAvailableShellUpdate with update available',
        selector: ShellUpdate.getAvailableShellUpdate,
        state: {
          shell: { update: { available: true, info: { version: '1.0.0' } } },
        },
        expected: '1.0.0',
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, expected } = spec
      it(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
