// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import reduce from 'lodash/reduce'
import {getPipette, getLabware} from '@opentrons/shared-data'
import type {PipetteName} from './pipetteData'
import {updatePipettes} from './actions'
import {LOAD_FILE, type LoadFileAction} from '../load-file'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {FilePipette} from '../file-types'

function createPipette (mount: Mount, model: string, tiprackModel: ?string): ?PipetteData {
  const id = `${mount}:${model}`
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
    tiprackModel
  }
}

export type PipetteReducerState = {
  byMount: {|
    left: ?string,
    right: ?string
  |},
  byId: {
    [pipetteId: string]: PipetteData
  }
}

const pipettes = handleActions({
  [LOAD_FILE]: (state: PipetteReducerState, action: LoadFileAction): PipetteReducerState => {
    const file = action.payload
    const {pipettes} = file
    // TODO: Ian 2018-06-29 create fns to access ProtocolFile data
    const {pipetteTiprackAssignments} = file['designer-application'].data
    const pipetteIds = Object.keys(pipettes)
    return {
      byMount: {
        left: pipetteIds.find(id => pipettes[id].mount === 'left'),
        right: pipetteIds.find(id => pipettes[id].mount === 'right')
      },
      byId: reduce(
        pipettes,
        (acc: {[pipetteId: string]: PipetteData}, p: FilePipette, id: string) => {
          const newPipette = createPipette(p.mount, p.model, pipetteTiprackAssignments[id])
          return newPipette
            ? {...acc, [id]: newPipette}
            : acc
        }, {})
    }
  },
  UPDATE_PIPETTES: (state: PipetteReducerState, action: ActionType<typeof updatePipettes>) => {
    const {leftModel, rightModel, leftTiprackModel, rightTiprackModel} = action.payload

    const leftPipette = (leftModel && leftTiprackModel)
      ? createPipette('left', leftModel, leftTiprackModel)
      : null

    const rightPipette = (rightModel && rightTiprackModel)
      ? createPipette('right', rightModel, rightTiprackModel)
      : null

    const newPipettes = ([leftPipette, rightPipette]).reduce(
      (acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
        if (!pipette) return acc
        return {
          ...acc,
          [pipette.id]: pipette
        }
      }, {})

    return {
      byMount: {
        left: leftPipette ? leftPipette.id : state.byMount.left,
        right: rightPipette ? rightPipette.id : state.byMount.right
      },
      byId: {
        ...state.byId,
        ...newPipettes
      }
    }
  }
}, {byMount: {left: null, right: null}, byId: {}})

const _allReducers = {
  pipettes
}

export type RootState = {
  pipettes: PipetteReducerState
}

export const rootReducer = combineReducers(_allReducers)
