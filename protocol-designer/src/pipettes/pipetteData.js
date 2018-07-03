// @flow
import compact from 'lodash/compact'
import {getPipette, getPipetteModels} from '@opentrons/shared-data'

// TODO: should a version of pipetteOptions be moved to shared-data,
// and used for both PD and Run App?
export const pipetteOptions = compact(getPipetteModels().map((model: string) => {
  const pipette = getPipette(model)
  return pipette ? {name: pipette.displayName, value: pipette.model} : null
}))
