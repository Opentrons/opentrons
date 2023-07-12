import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../types'

describe('calibration selectors', () => {
  describe('getCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: State = { calibration: {} } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return null if robot in state but no status', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: Fixtures.mockCalibrationStatus,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus
      )
    })
  })

  describe('getDeckCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: State = { calibration: {} } as any
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: Fixtures.mockCalibrationStatus,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus.deckCalibration.status
      )
    })
  })
})

describe('getDeckCalibrationData', () => {
  it('should return null if given a null robot name', () => {
    const state: State = { calibration: {} } as any
    expect(Selectors.getDeckCalibrationData(state, null)).toBe(null)
  })

  it('should return null if no robot in state', () => {
    const state: State = { calibration: {} } as any
    expect(Selectors.getDeckCalibrationData(state, 'robotName')).toBe(null)
  })

  it('should return deck calibration data if in state', () => {
    const state: State = {
      calibration: {
        robotName: {
          calibrationStatus: Fixtures.mockCalibrationStatus,
          pipetteOffsetCalibrations: null,
          tipLengthCalibrations: null,
        },
      },
    } as any
    expect(Selectors.getDeckCalibrationData(state, 'robotName')).toEqual(
      Fixtures.mockCalibrationStatus.deckCalibration.data
    )
  })
})
