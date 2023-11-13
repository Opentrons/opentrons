import * as Selectors from '../selectors'
import * as SessionsSelectors from '../../sessions/selectors'

import type { State } from '../../types'
import type { DeckCalibrationSessionDetails } from '../../sessions/deck-calibration/types'

jest.mock('../../sessions/selectors')

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

    it('should return true for getAnalyticsOptInSeen if no config', () => {
      const mockState = { config: null } as any
      expect(Selectors.getAnalyticsOptInSeen(mockState)).toBe(true)
    })

    it('should return config.analytics.seenOptIn with getAnalyticsOptInSeen', () => {
      const mockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: false, seenOptIn: false },
        },
      } as any
      expect(Selectors.getAnalyticsOptInSeen(mockState)).toBe(false)
    })
  })

  describe('analytics calibration selectors', () => {
    describe('getAnalyticsSessionExitDetails', () => {
      const mockGetRobotSessionById = SessionsSelectors.getRobotSessionById as jest.MockedFunction<
        typeof SessionsSelectors.getRobotSessionById
      >
      it('returns data if the session exists', () => {
        const mockState: State = {} as any
        mockGetRobotSessionById.mockReturnValue({
          sessionType: 'deckCalibration',
          details: {
            currentStep: 'inspectingTip',
          } as Partial<DeckCalibrationSessionDetails>,
          createParams: {},
          id: 'blah-bloo-blah',
        } as any)
        expect(
          Selectors.getAnalyticsSessionExitDetails(
            mockState,
            'my-robot',
            'blah-bloo-blah'
          )
        ).toEqual({ step: 'inspectingTip', sessionType: 'deckCalibration' })
        expect(SessionsSelectors.getRobotSessionById).toHaveBeenCalledWith(
          mockState,
          'my-robot',
          'blah-bloo-blah'
        )
      })
      it('returns null if the session cannot be found', () => {
        mockGetRobotSessionById.mockReturnValue(null)
        const mockState: State = {} as any
        expect(
          Selectors.getAnalyticsSessionExitDetails(
            mockState,
            'my-robot',
            'blah-bloo-blah'
          )
        ).toBeNull()
      })
    })
  })
})
