// @flow
import compact from 'lodash/compact'
import {getPipetteNameSpecs} from '@opentrons/shared-data'

const supportedPipetteNames = [
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
export const pipetteOptions = compact(supportedPipetteNames.map((name: string) => {
  const pipette = getPipetteNameSpecs(name)
  return pipette ? {name: pipette.displayName, value: pipette.name} : null
}))
