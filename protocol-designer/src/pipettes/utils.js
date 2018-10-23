// @flow
import {uuid} from '../utils'
import {getPipette, getLabware} from '@opentrons/shared-data'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {PipetteReducerState} from './type'

export function createPipette (
  mount: Mount,
  model: string,
  tiprackModel: ?string,
  overrideId?: string
): ?PipetteData {
  const id = overrideId || `pipette:${model}:${uuid()}`
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

// TODO: BC type left and right here with form mount values
export const createNewPipettesSlice = (state: PipetteReducerState, left: any, right: any): PipetteReducerState => {
  const leftPipette = (left.pipetteModel && left.tiprackModel)
    ? createPipette('left', left.pipetteModel, left.tiprackModel)
    : null

  const rightPipette = (right.pipetteModel && right.tiprackModel)
    ? createPipette('right', right.pipetteModel, right.tiprackModel)
    : null

  return {
    byMount: {
      left: leftPipette ? leftPipette.id : state.byMount.left,
      right: rightPipette ? rightPipette.id : state.byMount.right,
    },
    byId: {
      ...state.byId,
      ...([leftPipette, rightPipette]).reduce((acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
        if (!pipette) return acc
        return {...acc, [pipette.id]: pipette}
      }, {}),
    },
  }
}
