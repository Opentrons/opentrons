// @flow

import type { Labware } from '../../../labware-ingred/types'

export type StepFormContext = {
  labware?: ?{[labwareId: string]: Labware},
}
