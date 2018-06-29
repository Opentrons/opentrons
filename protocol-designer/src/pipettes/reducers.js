// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import mapValues from 'lodash/mapValues'
import {getPipette} from '@opentrons/shared-data'
import {pipetteDataByName, type PipetteName} from './pipetteData'
import {updatePipettes} from './actions'
import {LOAD_FILE, type LoadFileAction} from '../load-file'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {FilePipette} from '../file-types'

// TODO IMMEDIATELY have space in file for pipette tiprack type
const TODO_TIPRACK_MODEL = 'tiprack-10ul'

function createPipette (p: FilePipette, id: ?string, tiprackModel: string): ?PipetteData {
  const pipetteData = getPipette(p.model)
  if (!pipetteData) {
    console.error(`Pipette model '${p.model}' does not exist in shared-data`)
    return null
  }
  return {
    id: id || `${p.mount}:${p.model}`,
    mount: p.mount,
    maxVolume: pipetteData.nominalMaxVolumeUl,
    channels: pipetteData.channels,
    tiprackModel
  }
}

/** Creates a pipette from "name" of pipetteDataByName,
  * instead of by shared-data's pipette definitions' `model` */
function createPipetteDeprecated (name: PipetteName, mount: Mount, tiprackModel: string): PipetteData {
  const pipetteData = pipetteDataByName[name]
  if (!pipetteData) {
    // TODO Ian 2018-03-01 I want Flow to enforce `name` is a key in pipetteDataByName,
    // but it doesn't seem to want to be strict about it
    throw new Error('Invalid pipette name, no entry in pipetteDataByName')
  }
  return {
    id: `${mount}:${name}`,
    mount,
    maxVolume: pipetteData.maxVolume,
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
    const {pipettes} = action.payload
    const pipetteIds = Object.keys(pipettes)
    return {
      byMount: {
        left: pipetteIds.find(id => pipettes[id].mount === 'left'),
        right: pipetteIds.find(id => pipettes[id].mount === 'right')
      },
      byId: mapValues(pipettes, (p: FilePipette, id: string) =>
        createPipette(p, id, TODO_TIPRACK_MODEL))
    }
  },
  UPDATE_PIPETTES: (state: PipetteReducerState, action: ActionType<typeof updatePipettes>) => {
    const {left, right, leftTiprackModel, rightTiprackModel} = action.payload

    const leftPipette = (left && leftTiprackModel)
      ? createPipetteDeprecated(left, 'left', leftTiprackModel)
      : null

    const rightPipette = (right && rightTiprackModel)
      ? createPipetteDeprecated(right, 'right', rightTiprackModel)
      : null

    const newPipettes = ([leftPipette, rightPipette]).reduce(
      (acc: {[string]: PipetteData}, pipette: PipetteData | null) => {
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
