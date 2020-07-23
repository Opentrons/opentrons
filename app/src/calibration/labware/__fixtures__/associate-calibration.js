// @flow
import type { LabwareWithCalibration } from '../types'

export const mockLabwareWithCalibration: Array<LabwareWithCalibration> = [
  {
    quantity: 1,
    display: '',
    parent: '',
    calibration: { x: 1, y: 1, z: 1 },
  },
  {
    quantity: 1,
    display: '',
    parent: 'Magnetic Module GEN1',
    calibration: null,
  },
]
