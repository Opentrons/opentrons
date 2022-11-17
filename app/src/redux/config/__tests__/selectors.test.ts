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
        { label: 'Stable', value: 'latest' },
        { label: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest" and "beta" options if config is known and devtools are disabled', () => {
      const state: State = {
        config: { devtools: false, update: { channel: 'latest' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { label: 'Stable', value: 'latest' },
        { label: 'Beta', value: 'beta' },
      ])
    })

    it('should return "latest", "beta", and "alpha" options if devtools are enabled', () => {
      const state: State = {
        config: { devtools: true, update: { channel: 'latest' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { label: 'Stable', value: 'latest' },
        { label: 'Beta', value: 'beta' },
        { label: 'Alpha', value: 'alpha' },
      ])
    })

    it('should return an "alpha" option if devtools are disabled but current channel is alpha', () => {
      const state: State = {
        config: { devtools: false, update: { channel: 'alpha' } },
      } as any
      expect(Selectors.getUpdateChannelOptions(state)).toEqual([
        { label: 'Stable', value: 'latest' },
        { label: 'Beta', value: 'beta' },
        { label: 'Alpha', value: 'alpha' },
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

  describe('getIsLabwareOffsetCodeSnippetsOn', () => {
    it('should return true is saved value in config is true', () => {
      const state: State = {
        config: { labware: { showLabwareOffsetCodeSnippets: true } },
      } as any
      expect(Selectors.getIsLabwareOffsetCodeSnippetsOn(state)).toEqual(true)
    })

    it('should return false is saved value in config is false', () => {
      const state: State = {
        config: { labware: { showLabwareOffsetCodeSnippets: false } },
      } as any
      expect(Selectors.getIsLabwareOffsetCodeSnippetsOn(state)).toEqual(false)
    })
  })

  describe('getPathToPythonOverride', () => {
    it('should return path if path is specified', () => {
      const state: State = {
        config: { python: { pathToPythonOverride: 'path' } },
      } as any
      expect(Selectors.getPathToPythonOverride(state)).toEqual('path')
    })

    it('should return null if saved value in config is null', () => {
      const state: State = {
        config: { python: { pathToPythonOverride: null } },
      } as any
      expect(Selectors.getPathToPythonOverride(state)).toEqual(null)
    })
  })

  describe('getProtocolsStoredSortKey', () => {
    it('should return ProtocolSort if sortKey is selected', () => {
      const state: State = {
        config: {
          protocolsSortKey: { protocolsStoredSortKey: 'alphabetical' },
        },
      } as any
      expect(Selectors.getProtocolsStoredSortKey(state)).toEqual('alphabetical')
    })

    it('should return null if saved value in config is null', () => {
      const state: State = {
        config: { protocolsSortKey: { protocolsStoredSortKey: null } },
      } as any
      expect(Selectors.getProtocolsStoredSortKey(state)).toEqual(null)
    })
  })
})
