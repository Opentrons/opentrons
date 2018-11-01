// @flow
import compact from 'lodash/compact'
import {getPipetteModelSpecs} from '@opentrons/shared-data'

const supportedPipetteModels = [
  'p10_single',
  'p10_multi',
  'p50_single',
  'p50_multi',
  'p300_single',
  'p300_multi',
  'p1000_single',
]

// TODO: should a version of pipetteOptions be moved to shared-data,
// and used for both PD and Run App?
export const pipetteOptions = compact(supportedPipetteModels.map((model: string) => {
  const pipette = getPipetteModelSpecs(model)
  return pipette ? {name: pipette.displayName, value: pipette.model} : null
}))
