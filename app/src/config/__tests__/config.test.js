// @flow
// config tests
import * as Cfg from '..'
import type { State } from '../../types'
import { configReducer } from '../reducer'
import type { Config } from '../types'

jest.mock('../../shell/remote', () => ({
  remote: { INITIAL_CONFIG: { isConfig: true } },
}))

describe('config', () => {
  let state: $Shape<{| ...State, config: $Shape<Config> |}>

  beforeEach(() => {
    jest.clearAllMocks()

    state = {
      config: {
        devtools: true,
        alerts: {
          ignored: ['someAlert'],
        },
      },
    }
  })

  describe('actions', () => {
    it('can create an config:INITIALIZED for initial config values', () => {
      expect(Cfg.configInitialized(state.config)).toEqual({
        type: 'config:INITIALIZED',
        payload: { config: state.config },
      })
    })

    it('can create an config:VALUE_UPDATED action for a successful update', () => {
      expect(Cfg.configValueUpdated('foo.bar', false)).toEqual({
        type: 'config:VALUE_UPDATED',
        payload: { path: 'foo.bar', value: false },
      })
    })

    it('can create an config:UPDATE_VALUE action to request a value update', () => {
      expect(Cfg.updateConfigValue('foo.bar', false)).toEqual({
        type: 'config:UPDATE_VALUE',
        payload: { path: 'foo.bar', value: false },
        meta: { shell: true },
      })
    })

    it('can create a config:RESET_VALUE action to request a value reset', () => {
      expect(Cfg.resetConfigValue('foo.bar')).toEqual({
        type: 'config:RESET_VALUE',
        payload: { path: 'foo.bar' },
        meta: { shell: true },
      })
    })

    it('can create a config:TOGGLE_VALUE action to request a toggle of a boolean value', () => {
      expect(Cfg.toggleConfigValue('foo.bar')).toEqual({
        type: 'config:TOGGLE_VALUE',
        payload: { path: 'foo.bar' },
        meta: { shell: true },
      })
    })

    it('can create a config:ADD_UNIQUE_VALUE action to request an append of a value to a set', () => {
      expect(Cfg.addUniqueConfigValue('foo.bar', 'value')).toEqual({
        type: 'config:ADD_UNIQUE_VALUE',
        payload: { path: 'foo.bar', value: 'value' },
        meta: { shell: true },
      })
    })

    it('can create a config:SUBTRACT_VALUE action to request a removal of a value from a set', () => {
      expect(Cfg.subtractConfigValue('foo.bar', 'value')).toEqual({
        type: 'config:SUBTRACT_VALUE',
        payload: { path: 'foo.bar', value: 'value' },
        meta: { shell: true },
      })
    })
  })

  describe('reducer', () => {
    it('handles config:INITIALIZED', () => {
      const action = Cfg.configInitialized(state.config)

      expect(configReducer(null, action)).toEqual(state.config)
    })

    it('handles config:VALUE_UPDATED', () => {
      const action = Cfg.configValueUpdated('devtools', false)

      expect(configReducer(state.config, action)).toEqual({
        devtools: false,
        alerts: {
          ignored: ['someAlert'],
        },
      })
    })

    it('ignores config:VALUE_UPDATED if no config in state', () => {
      const action = Cfg.configValueUpdated('devtools', false)

      expect(configReducer(null, action)).toEqual(null)
    })
  })

  describe('selectors', () => {
    it('getConfig', () => {
      expect(Cfg.getConfig(state)).toEqual(state.config)
    })
  })
})
