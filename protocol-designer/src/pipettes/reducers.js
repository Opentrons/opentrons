// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {uuid} from '../utils'
import {getPipette, getLabware} from '@opentrons/shared-data'

import type {Mount} from '@opentrons/components'
import type {LoadFileAction, NewProtocolFields} from '../load-file'
import type {PipetteData} from '../step-generation'
import type {FilePipette} from '../file-types'

function createPipette (
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

export type PipetteReducerState = {
  byMount: {|
    left: ?string,
    right: ?string,
  |},
  byId: {
    [pipetteId: string]: PipetteData,
  },
}

const pipettes = handleActions({
  LOAD_FILE: (state: PipetteReducerState, action: LoadFileAction): PipetteReducerState => {
    const file = action.payload
    const {pipettes} = file
    // TODO: Ian 2018-06-29 create fns to access ProtocolFile data
    const {pipetteTiprackAssignments} = file['designer-application'].data
    const pipetteIds = Object.keys(pipettes)
    return {
      byMount: {
        left: pipetteIds.find(id => pipettes[id].mount === 'left'),
        right: pipetteIds.find(id => pipettes[id].mount === 'right'),
      },
      byId: reduce(
        pipettes,
        (acc: {[pipetteId: string]: PipetteData}, p: FilePipette, id: string) => {
          const newPipette = createPipette(p.mount, p.model, pipetteTiprackAssignments[id], id)
          return newPipette
            ? {...acc, [id]: newPipette}
            : acc
        }, {}),
    }
  },
  CREATE_NEW_PROTOCOL: (
    state: PipetteReducerState,
    action: {payload: NewProtocolFields}
  ): PipetteReducerState => {
    const {left, right} = action.payload

    const leftPipette = (left.pipetteModel && left.tiprackModel)
      ? createPipette('left', left.pipetteModel, left.tiprackModel)
      : null

    const rightPipette = (right.pipetteModel && right.tiprackModel)
      ? createPipette('right', right.pipetteModel, right.tiprackModel)
      : null

    const newPipettes = ([leftPipette, rightPipette]).reduce(
      (acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
        if (!pipette) return acc
        return {
          ...acc,
          [pipette.id]: pipette,
        }
      }, {})

    return {
      byMount: {
        left: leftPipette ? leftPipette.id : state.byMount.left,
        right: rightPipette ? rightPipette.id : state.byMount.right,
      },
      byId: {
        ...state.byId,
        ...newPipettes,
      },
    }
  },
  SWAP_PIPETTES: (
    state: PipetteReducerState,
    action: {payload: NewProtocolFields}
  ): PipetteReducerState => {
    const byId = mapValues(state.byId, (pipette: PipetteData): PipetteData => ({
      ...pipette,
      mount: (pipette.mount === 'left') ? 'right' : 'left',
    }))

    return ({
      byMount: {
        left: state.byMount.right,
        right: state.byMount.left,
      },
      byId,
    })
  },
}, {byMount: {left: null, right: null}, byId: {}})

const _allReducers = {
  pipettes,
}

export type RootState = {
  pipettes: PipetteReducerState,
}

export const rootReducer = combineReducers(_allReducers)
