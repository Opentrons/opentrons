// @flow
import {getPipette, getPipetteModels} from '@opentrons/shared-data'
import type {Channels} from '@opentrons/components'

export type PipetteName = any // TODO BC 2018-06-29 get type from shared-data
export const pipetteOptions = getPipetteModels().map((model: string) => {
  const pipette = getPipette(model)
  return {name: pipette.displayName, value: pipette.model}
})