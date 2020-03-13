// @flow
import typeof { START_CHECK } from './constants'

export type StartDeckCalibrationCheckAction = {
  type: START_CHECK,
  meta: {| robotName: string |},
}
