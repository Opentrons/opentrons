import * as Protocol from '../../protocol'
import * as Hash from '../hash'

import * as Selectors from '../selectors'
import * as CalibrationSelectors from '../../calibration/selectors'
import * as SessionsSelectors from '../../sessions/selectors'
import * as DiscoverySelectors from '../../discovery/selectors'
import * as PipetteSelectors from '../../pipettes/selectors'

import * as SessionFixtures from '../../sessions/__fixtures__'
import * as SessionTypes from '../../sessions/types'

import type { State } from '../../types'

import type { DeckCalibrationSessionDetails } from '../../sessions/deck-calibration/types'

jest.mock('../../protocol/selectors')
jest.mock('../../robot/selectors')
jest.mock('../../calibration/selectors')
jest.mock('../../sessions/selectors')
jest.mock('../../discovery/selectors')
jest.mock('../../pipettes/selectors')
jest.mock('../hash')

describe('analytics selectors', () => {
  let mockState: State

  beforeEach(() => {
    mockState = { mockState: true } as any
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

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

    it('should return false with getAnalyticsOptedIn if no config', () => {
      const mockState = { config: null } as any
      expect(Selectors.getAnalyticsOptedIn(mockState)).toBe(false)
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
    const mockGetConnectedRobot = DiscoverySelectors.getConnectedRobot as jest.MockedFunction<
      typeof DiscoverySelectors.getConnectedRobot
    >
    const mockGetAttachedPipettes = PipetteSelectors.getAttachedPipettes as jest.MockedFunction<
      typeof PipetteSelectors.getAttachedPipettes
    >
    describe('getAnalyticsPipetteCalibrationData', () => {
      const mockGetAttachedPipetteCalibrations = PipetteSelectors.getAttachedPipetteCalibrations as jest.MockedFunction<
        typeof PipetteSelectors.getAttachedPipetteCalibrations
      >
      it('should get data if robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue({
          name: 'my robot',
        } as any)
        mockGetAttachedPipetteCalibrations.mockReturnValue({
          left: {
            offset: {
              status: { markedBad: false, markedAt: null, source: null },
            },
            tipLength: null,
          },
          right: { offset: null, tipLength: null },
        } as any)
        mockGetAttachedPipettes.mockReturnValue({
          left: { model: 'my pipette model' },
          right: null,
        } as any)
        expect(
          Selectors.getAnalyticsPipetteCalibrationData(mockState, 'left')
        ).toEqual({
          calibrationExists: true,
          markedBad: false,
          pipetteModel: 'my pipette model',
        })
      })
      it('should return null if no robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue(null)
        expect(
          Selectors.getAnalyticsPipetteCalibrationData(mockState, 'right')
        ).toBeNull()
      })
    })

    describe('getAnalyticsTipLengthCalibrationData', () => {
      const mockGetAttachedPipetteCalibrations = PipetteSelectors.getAttachedPipetteCalibrations as jest.MockedFunction<
        typeof PipetteSelectors.getAttachedPipetteCalibrations
      >

      it('should get data if robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue({
          name: 'my robot',
        } as any)
        mockGetAttachedPipetteCalibrations.mockReturnValue({
          right: {
            tipLength: {
              status: { markedBad: true, markedAt: null, source: null },
            },
            offset: null,
          },
          left: { offset: null, tipLength: null },
        } as any)
        mockGetAttachedPipettes.mockReturnValue({
          right: { model: 'my pipette model' },
          left: null,
        } as any)
        expect(
          Selectors.getAnalyticsTipLengthCalibrationData(mockState, 'right')
        ).toEqual({
          calibrationExists: true,
          markedBad: true,
          pipetteModel: 'my pipette model',
        })
      })
      it('should return null if no robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue(null)
        expect(
          Selectors.getAnalyticsTipLengthCalibrationData(mockState, 'left')
        ).toBeNull()
      })
    })
    describe('getAnalyticsDeckCalibrationData', () => {
      const mockGetDeckCalibrationData = CalibrationSelectors.getDeckCalibrationData as jest.MockedFunction<
        typeof CalibrationSelectors.getDeckCalibrationData
      >
      const mockGetDeckCalibrationStatus = CalibrationSelectors.getDeckCalibrationStatus as jest.MockedFunction<
        typeof CalibrationSelectors.getDeckCalibrationStatus
      >
      it('should get data if robot connected and format ok', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue({
          name: 'my robot',
        } as any)
        mockGetDeckCalibrationData.mockReturnValue({
          status: { markedBad: true, markedAt: null, source: null },
        } as any)
        mockGetDeckCalibrationStatus.mockReturnValue('IDENTITY')
        mockGetAttachedPipettes.mockReturnValue({
          right: { model: 'my pipette model' },
          left: { model: 'my other pipette' },
        } as any)
        expect(Selectors.getAnalyticsDeckCalibrationData(mockState)).toEqual({
          calibrationStatus: 'IDENTITY',
          markedBad: true,
          pipettes: {
            left: { model: 'my other pipette' },
            right: { model: 'my pipette model' },
          },
        })
      })
      it('should return null if no robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue(null)
        expect(Selectors.getAnalyticsDeckCalibrationData(mockState)).toBeNull()
      })
      it('should handle old deck cal data', () => {
        mockGetConnectedRobot.mockReturnValue({
          name: 'my robot',
        } as any)
        mockGetDeckCalibrationData.mockReturnValue([
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [8, 9, 10, 11],
          [12, 13, 14, 15],
        ])
        mockGetDeckCalibrationStatus.mockReturnValue('IDENTITY')
        mockGetAttachedPipettes.mockReturnValue({
          right: { model: 'my pipette model' },
          left: { model: 'my other pipette' },
        } as any)
        expect(Selectors.getAnalyticsDeckCalibrationData(mockState)).toEqual({
          calibrationStatus: 'IDENTITY',
          markedBad: null,
          pipettes: {
            left: { model: 'my other pipette' },
            right: { model: 'my pipette model' },
          },
        })
      })
    })
    describe('getAnalyticsHealthCheckData', () => {
      const getRobotSessionOfType = SessionsSelectors.getRobotSessionOfType as jest.MockedFunction<
        typeof SessionsSelectors.getRobotSessionOfType
      >
      it('should get data if robot connected', () => {
        const mockCalibrationCheckSession: SessionTypes.CalibrationCheckSession = {
          id: 'fake_check_session_id',
          ...SessionFixtures.mockCalibrationCheckSessionAttributes,
        }
        getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
        mockGetConnectedRobot.mockReturnValue({
          name: 'my robot',
        } as any)
        const comparisonsLeft =
          SessionFixtures.mockCalibrationCheckSessionAttributes.details
            .comparisonsByPipette.first
        const comparisonsRight =
          SessionFixtures.mockCalibrationCheckSessionAttributes.details
            .comparisonsByPipette.second
        expect(Selectors.getAnalyticsHealthCheckData(mockState)).toEqual({
          pipettes: {
            right: {
              model: 'fake_pipette_model',
              comparisons: comparisonsRight,
              succeeded: false,
            },
            left: {
              model: 'fake_pipette_model',
              comparisons: comparisonsLeft,
              succeeded: true,
            },
          },
        })
      })
      it('should return null if no robot connected', () => {
        const mockState: State = {} as any
        mockGetConnectedRobot.mockReturnValue(null)
        expect(Selectors.getAnalyticsHealthCheckData(mockState)).toBeNull()
      })
    })
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
