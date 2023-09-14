// shell/update tests

import * as ShellUpdate from '../update'
import { shellUpdateReducer } from '../reducer'
import type { ShellUpdateState, ShellUpdateAction } from '../types'
import type { State } from '../../types'

describe('shell/update', () => {
  describe('action creators', () => {
    const SPECS: Array<{
      name: string
      creator: (...args: any[]) => ShellUpdateAction
      args: any[]
      expected: any
    }> = [
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
        expected: {
          type: 'shell:DOWNLOAD_UPDATE',
          meta: { shell: true },
        },
      },
      {
        name: 'shell:APPLY_UPDATE',
        creator: ShellUpdate.applyShellUpdate,
        args: [],
        expected: { type: 'shell:APPLY_UPDATE', meta: { shell: true } },
      },
    ]

    SPECS.forEach(spec => {
      const { name, creator, args, expected } = spec
      it(name, () => expect(creator(...args)).toEqual(expected))
    })
  })

  describe('reducer', () => {
    const SPECS: Array<{
      name: string
      action: ShellUpdateAction
      initialState: ShellUpdateState
      expected: any
    }> = [
      {
        name: 'handles shell:CHECK_UPDATE',
        action: { type: 'shell:CHECK_UPDATE' } as any,
        initialState: { checking: false, error: { message: 'AH' } } as any,
        expected: { checking: true, error: null },
      },
      {
        name: 'handles shell:CHECK_UPDATE_RESULT with info',
        action: {
          type: 'shell:CHECK_UPDATE_RESULT',
          payload: { available: true, info: { version: '1.0.0' } } as any,
        },
        initialState: { checking: true, available: false, info: null } as any,
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
          payload: { error: { message: 'AH' }, available: false, info: null },
        },
        initialState: {
          checking: true,
          error: null,
          available: false,
          info: undefined,
        } as any,
        expected: {
          checking: false,
          error: { message: 'AH' },
          available: false,
          info: null,
        },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE',
        action: { type: 'shell:DOWNLOAD_UPDATE' } as any,
        initialState: { downloading: false, error: { message: 'AH' } } as any,
        expected: { downloading: true, error: null },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE_RESULT without error',
        action: {
          type: 'shell:DOWNLOAD_UPDATE_RESULT',
          payload: {},
        },
        initialState: { downloading: true, error: null } as any,
        expected: { downloading: false, downloaded: true, error: null },
      },
      {
        name: 'handles shell:DOWNLOAD_UPDATE_RESULT with error',
        action: {
          type: 'shell:DOWNLOAD_UPDATE_RESULT',
          payload: { error: { message: 'AH' } },
        },
        initialState: { downloading: true, error: null } as any,
        expected: {
          downloading: false,
          downloaded: false,
          error: { message: 'AH' },
        },
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
    const SPECS: Array<{
      name: string
      selector: (state: State) => any
      state: State
      expected: unknown
    }> = [
      {
        name: 'getAvailableShellUpdate with nothing available',
        selector: ShellUpdate.getAvailableShellUpdate,
        state: {
          shell: { update: { available: false, info: { version: '1.0.0' } } },
        } as any,
        expected: null,
      },
      {
        name: 'getAvailableShellUpdate with update available',
        selector: ShellUpdate.getAvailableShellUpdate,
        state: {
          shell: { update: { available: true, info: { version: '1.0.0' } } },
        } as any,
        expected: '1.0.0',
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, expected } = spec
      it(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
