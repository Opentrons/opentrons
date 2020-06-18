// @flow

import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../types'

describe('calibration selectors', () => {
  describe('getCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: $Shape<State> = { calibration: {} }
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: $Shape<State> = {
        calibration: {
          robotName: { calibrationStatus: Fixtures.mockCalibrationStatus },
        },
      }
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus
      )
    })
  })

  describe('getDeckCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: $Shape<State> = { calibration: {} }
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: $Shape<State> = {
        calibration: {
          robotName: { calibrationStatus: Fixtures.mockCalibrationStatus },
        },
      }
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus.deckCalibration.status
      )
    })
  })
})
