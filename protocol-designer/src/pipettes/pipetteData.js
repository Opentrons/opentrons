// @flow
import compact from 'lodash/compact'
import {getPipette} from '@opentrons/shared-data'

// TODO: figure out what pipette versions mean in context of PD,
// and annotate pipette-config so it's more straightforward to compare models
const supportedPipetteModels = [
  'p10_single_v1.3',
  'p10_multi_v1.3',
  'p50_single_v1.3',
  'p50_multi_v1.3',
  'p300_single_v1.3',
  'p300_multi_v1.3',
  'p1000_single_v1.3',
]

// TODO: should a version of pipetteOptions be moved to shared-data,
// and used for both PD and Run App?
export const pipetteOptions = compact(supportedPipetteModels.map((model: string) => {
  const pipette = getPipette(model)
  return pipette ? {name: pipette.displayName, value: pipette.model} : null
}))
