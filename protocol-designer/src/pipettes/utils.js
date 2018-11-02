// @flow
import {getPipette, getLabware} from '@opentrons/shared-data'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {PipetteFields} from '../load-file'
import type {PipetteReducerState} from './types'

export function createPipette (
  mount: Mount,
  model: string,
  tiprackModel: ?string,
  overrideId?: string
): ?PipetteData {
  const id = overrideId || `pipette:${mount}:${model}`
  const pipetteData = getPipette(model)

  if (!pipetteData) {
    console.error(`Pipette ${id} - model '${model}' does not exist in shared-data`)
    return null
  }
  if (!tiprackModel) {
    console.error(`Pipette ${id} - no tiprackModel assigned. Skipping pipette creation.`)
    return null
  }
  if (!getLabware(tiprackModel)) {
    console.error(`Pipette ${id} - tiprackModel '${tiprackModel}' does not exist in shared-data`)
    return null
  }
  return {
    id,
    model,
    mount,
    maxVolume: pipetteData.nominalMaxVolumeUl,
    channels: pipetteData.channels,
    tiprackModel,
  }
}
