// @flow

import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../../types'

describe('calibration selectors', () => {
  describe('getCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: $Shape<State> = { calibration: {} }
      expect(Selectors.getListOfLabwareCalibrations(state, 'robotName')).toBe(
        []
      )
    })

    it('should return list of calibrations if in state', () => {
      const state: $Shape<State> = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            labwareCalibration: [Fixtures.mockLabwareCalibration],
          },
        },
      }
      expect(
        Selectors.getListOfLabwareCalibrations(state, 'robotName')
      ).toEqual([Fixtures.mockLabwareCalibration])
    })
  })
})

//   describe('get single labware', () => {
//     it('should return null if no robot in state', () => {
//       const state: $Shape<State> = { calibration: {} }
//       expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toBe(null)
//     })

//     it('should return the single labware', () => {
//       const state: $Shape<State> = {
//         calibration: {
//           robotName: { calibrationStatus: Fixtures.mockCalibrationStatus },
//         },
//         labwareCalibration: {},
//       }
//       expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toEqual(
//         Fixtures.mockCalibrationStatus.deckCalibration.status
//       )
//     })
//   })
// })
