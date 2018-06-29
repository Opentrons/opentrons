// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import reduce from 'lodash/reduce'
import {getPipette, getLabware} from '@opentrons/shared-data'
import {pipetteDataByName, type PipetteName} from './pipetteData'
import {updatePipettes} from './actions'
import {LOAD_FILE, type LoadFileAction} from '../load-file'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {FilePipette} from '../file-types'

function createPipette (p: FilePipette, _id: ?string, tiprackModel: ?string): ?PipetteData {
  const id = _id || `${p.mount}:${p.model}`
  const pipetteData = getPipette(p.model)

  if (!pipetteData) {
    console.error(`Pipette ${id} - model '${p.model}' does not exist in shared-data`)
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
    mount: p.mount,
    maxVolume: pipetteData.nominalMaxVolumeUl,
    channels: pipetteData.channels,
    tiprackModel
  }
}

/** Creates a pipette from "name" of pipetteDataByName,
  * instead of by shared-data's pipette definitions' `model` */
// TODO: Ian 2018-06-29 remove this and all references to 'pipetteDataByName'
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
          const newPipette = createPipette(p, id, pipetteTiprackAssignments[id])
          return newPipette
            ? {...acc, [id]: newPipette}
            : acc
        }, {})
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
