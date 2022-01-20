import * as Selectors from '../selectors'

import type { State } from '../../types'

describe('shell selectors', () => {
  describe('getDevtoolsEnabled', () => {
    it('should return false if config is unknown', () => {
      const state: State = { config: null } as any
      expect(Selectors.getDevtoolsEnabled(state)).toEqual(false)
    })

    it('should return config.devtools if config is known', () => {
      const state: State = { config: { devtools: true } } as any
      expect(Selectors.getDevtoolsEnabled(state)).toEqual(true)
    })
  })

  describe('getFeatureFlags', () => {
    it('should return an empty object if config is unknown', () => {
      const state: State = { config: null } as any
      expect(Selectors.getFeatureFlags(state)).toEqual({})
    })

    it('should return config.devInternal if config is known', () => {
      const state: State = {
        config: { devInternal: { ['feature' as any]: true } },
      } as any
      expect(Selectors.getFeatureFlags(state)).toEqual({ feature: true })
    })
  })

  describe('getUpdateChannel', () => {
    it('should return "latest" if config is unknown', () => {
      const state: State = { config: null } as any
      expect(Selectors.getUpdateChannel(state)).toEqual('latest')
    })

    it('should return config.update.channel if config is known', () => {
      const state: State = {
        config: { update: { channel: 'beta' } },
      } as any
      expect(Selectors.getUpdateChannel(state)).toEqual('beta')
    })
  })

  describe('getUpdateChannelOptions', () => {
    it('should return "latest" and "beta" options if config is unknown', () => {
      const state: State = { config: null } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest" and "beta" options if config is known and devtools are disabled', () => {
      const state: State = {
        config: { devtools: false, update: { channel: 'latest' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest", "beta", and "alpha" options if devtools are enabled', () => {
      const state: State = {
        config: { devtools: true, update: { channel: 'latest' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
        { name: 'Alpha', value: 'alpha' },
      ])
    })

    it('should return an "alpha" option if devtools are disabled but current channel is alpha', () => {
      const state: State = {
        config: { devtools: false, update: { channel: 'alpha' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { name: 'Stable', value: 'latest' },
        { name: 'Beta', value: 'beta' },
        { name: 'Alpha', value: 'alpha' },
      ])
    })
  })

  describe('getUseTrashSurfaceForTipCal', () => {
    it('should return null if saved value in config is null', () => {
      const state: State = {
        config: { calibration: { useTrashSurfaceForTipCal: null } },
      } as any
      expect(Selectors.getUseTrashSurfaceForTipCal(state)).toEqual(null)
    })

    it('should return true if saved value in config is true', () => {
      const state: State = {
        config: { calibration: { useTrashSurfaceForTipCal: true } },
      } as any
      expect(Selectors.getUseTrashSurfaceForTipCal(state)).toEqual(true)
    })

    it('should return false if saved value in config is false', () => {
      const state: State = {
        config: { calibration: { useTrashSurfaceForTipCal: false } },
      } as any
      expect(Selectors.getUseTrashSurfaceForTipCal(state)).toEqual(false)
    })
  })

  describe('getIsLabwareOffsetDataOn', () => {
    it('should return true is saved value in config is true', () => {
      const state: State = {
        config: { robotSettings: { labwareOffsetData: true } },
      } as any
      expect(Selectors.getIsLabwareOffsetDataOn(state)).toEqual(true)
    })

    it('should return false is saved value in config is false', () => {
      const state: State = {
        config: { robotSettings: { labwareOffsetData: false } },
      } as any
      expect(Selectors.getIsLabwareOffsetDataOn(state)).toEqual(false)
    })
  })
})
