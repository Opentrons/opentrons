// @flow

import * as Selectors from '../selectors'

import type { State } from '../../types'
import type { Config } from '../types'

type MockState = $Shape<{| ...State, config: $Shape<Config> | null |}>

describe('shell selectors', () => {
  describe('getDevtoolsEnabled', () => {
    it('should return false if config is unknown', () => {
      const state: MockState = { config: null }
      expect(Selectors.getDevtoolsEnabled(state)).toEqual(false)
    })

    it('should return config.devtools if config is known', () => {
      const state: MockState = { config: { devtools: true } }
      expect(Selectors.getDevtoolsEnabled(state)).toEqual(true)
    })
  })

  describe('getFeatureFlags', () => {
    it('should return an empty object if config is unknown', () => {
      const state: MockState = { config: null }
      expect(Selectors.getFeatureFlags(state)).toEqual({})
    })

    it('should return config.devInternal if config is known', () => {
      const state: MockState = {
        config: { devInternal: { [('feature': any)]: true } },
      }
      expect(Selectors.getFeatureFlags(state)).toEqual({ feature: true })
    })
  })

  describe('getUpdateChannel', () => {
    it('should return "latest" if config is unknown', () => {
      const state: MockState = { config: null }
      expect(Selectors.getUpdateChannel(state)).toEqual('latest')
    })

    it('should return config.update.channel if config is known', () => {
      const state: MockState = {
        config: { update: { channel: 'beta' } },
      }
      expect(Selectors.getUpdateChannel(state)).toEqual('beta')
    })
  })

  describe('getUpdateChannelOptions', () => {
    it('should return "latest" and "beta" options if config is unknown', () => {
      const state: MockState = { config: null }
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest" and "beta" options if config is known and devtools are disabled', () => {
      const state: MockState = {
        config: { devtools: false, update: { channel: 'latest' } },
      }
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest", "beta", and "alpha" options if devtools are enabled', () => {
      const state: MockState = {
        config: { devtools: true, update: { channel: 'latest' } },
      }
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
        { name: 'Alpha', value: 'alpha' },
      ])
    })

    it('should return an "alpha" option if devtools are disabled but current channel is alpha', () => {
      const state: MockState = {
        config: { devtools: false, update: { channel: 'alpha' } },
      }
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
        { name: 'Alpha', value: 'alpha' },
      ])
    })
  })
})
