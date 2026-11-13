import { describe, expect, it } from 'vitest'

import * as Selectors from '../selectors'

describe('analytics selectors', () => {
  describe('analytics config selectors', () => {
    it('should return null with getAnalyticsConfig if no config', () => {
      const mockState = { config: null } as any
      expect(Selectors.getAnalyticsConfig(mockState)).toBe(null)
    })

    it('should return config.analytics with getAnalyticsConfig', () => {
      const mockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: true, seenOptIn: true },
        },
      } as any
      expect(Selectors.getAnalyticsConfig(mockState)).toEqual({
        appId: 'foobar',
        optedIn: true,
        seenOptIn: true,
      })
    })

    it('should return true with getAnalyticsOptedIn if no config', () => {
      const mockState = { config: null } as any
      expect(Selectors.getAnalyticsOptedIn(mockState)).toBe(true)
    })

    it('should return config.analytics.optedIn with getAnalyticsOptedIn', () => {
      const mockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: true, seenOptIn: true },
        },
      } as any
      expect(Selectors.getAnalyticsOptedIn(mockState)).toBe(true)
    })
  })
})
