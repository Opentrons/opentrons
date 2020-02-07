// config tests
import { updateConfig, resetConfig, getConfig } from '..'
import { configReducer } from '../reducer'

jest.mock('../../shell/remote', () => ({ INITIAL_CONFIG: { isConfig: true } }))

describe('config', () => {
  let state

  beforeEach(() => {
    jest.clearAllMocks()

    state = {
      config: {
        foo: { bar: 'baz' },
        qux: 'fizzbuzz',
      },
    }
  })

  describe('actions', () => {
    // updateConfig triggers an update call to app-shell
    test('config:UPDATE', () => {
      expect(updateConfig('foo.bar', false)).toEqual({
        type: 'config:UPDATE',
        payload: { path: 'foo.bar', value: false },
        meta: { shell: true },
      })
    })

    test('config:RESET', () => {
      expect(resetConfig('foo.bar')).toEqual({
        type: 'config:RESET',
        payload: { path: 'foo.bar' },
        meta: { shell: true },
      })
    })
  })

  describe('reducer', () => {
    beforeEach(() => {
      state = state.config
    })

    test('gets store and overrides from remote for initial state', () => {
      expect(configReducer(null, {})).toEqual({ isConfig: true })
    })

    test('handles config:SET', () => {
      const action = {
        type: 'config:SET',
        payload: { path: 'foo.bar', value: 'xyz' },
      }

      expect(configReducer(state, action)).toEqual({
        foo: { bar: 'xyz' },
        qux: 'fizzbuzz',
      })
    })
  })

  describe('selectors', () => {
    test('getConfig', () => {
      expect(getConfig(state)).toEqual(state.config)
    })
  })
})
