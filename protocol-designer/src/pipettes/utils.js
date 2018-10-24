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
  const prevLeftPipette = state.byId[state.byMount.left]
  const prevRightPipette = state.byId[state.byMount.right]

  const leftChanged = left.pipetteModel !== (prevLeftPipette && prevLeftPipette.model) ||
    left.tiprackModel !== (prevLeftPipette && prevLeftPipette.tiprackModel)

  const rightChanged = right.pipetteModel !== (prevRightPipette && prevRightPipette.model) ||
    right.tiprackModel !== (prevRightPipette && prevRightPipette.tiprackModel)

  const newLeftPipette = (leftChanged && left.pipetteModel && left.tiprackModel)
    ? createPipette('left', left.pipetteModel, left.tiprackModel)
    : null

  const newRightPipette = (rightChanged && right.pipetteModel && right.tiprackModel)
    ? createPipette('right', right.pipetteModel, right.tiprackModel)
    : null

  return {
    byMount: {
      left: newLeftPipette ? newLeftPipette.id : state.byMount.left,
      right: newRightPipette ? newRightPipette.id : state.byMount.right,
    },
    byId: ([newLeftPipette, newRightPipette]).reduce((acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
      if (!pipette) return acc
      return {...acc, [pipette.id]: pipette}
    }, {}),
  }
}
