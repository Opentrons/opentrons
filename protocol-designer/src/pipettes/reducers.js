// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import type {LoadFileAction, NewProtocolFields} from '../load-file'
import type {PipetteData} from '../step-generation'
import type {FilePipette} from '../file-types'
import {createPipette, createNewPipettesSlice} from './utils'
import type {PipetteReducerState, UpdatePipettesAction} from './types'

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

export type PipetteIdByMount = {|
  left: ?string,
  right: ?string,
|}

export type PipetteById = {[pipetteId: string]: PipetteData}

const byId = handleActions({
  LOAD_FILE: (state: PipetteById, action: LoadFileAction): PipetteById => {
    const file = action.payload
    const {pipettes} = file
    // TODO: Ian 2018-06-29 create fns to access ProtocolFile data
    const {pipetteTiprackAssignments} = file['designer-application'].data
    return reduce(pipettes, (acc: {[pipetteId: string]: PipetteData}, p: FilePipette, id: string) => {
      const newPipette = createPipette(p.mount, p.model, pipetteTiprackAssignments[id], id)
      return newPipette
        ? {...acc, [id]: newPipette}
        : acc
    }, {})
  },
  EDIT_PIPETTES: (
    state: PipetteById,
    action: {payload: NewProtocolFields}
  ): PipetteById => {
    const {left, right} = action.payload

    const leftPipette = (left.pipetteModel && left.tiprackModel)
      ? createPipette('left', left.pipetteModel, left.tiprackModel)
      : null

    const rightPipette = (right.pipetteModel && right.tiprackModel)
      ? createPipette('right', right.pipetteModel, right.tiprackModel)
      : null

    const newPipettes: PipetteById = ([leftPipette, rightPipette]).reduce(
      (acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
        if (!pipette) return acc
        return {
          ...acc,
          [pipette.id]: pipette,
        }
      }, {})

    return {
      ...state,
      ...newPipettes,
    }
  },
  UPDATE_PIPETTES: (state: PipetteReducerState, action: UpdatePipetteAction) => action.payload.byId,
  CREATE_NEW_PROTOCOL: (
    state: PipetteById,
    action: {payload: NewProtocolFields}
  ): PipetteById => {
    const {left, right} = action.payload

    const leftPipette = (left.pipetteModel && left.tiprackModel)
      ? createPipette('left', left.pipetteModel, left.tiprackModel)
      : null

    const rightPipette = (right.pipetteModel && right.tiprackModel)
      ? createPipette('right', right.pipetteModel, right.tiprackModel)
      : null

    const newPipettes: PipetteById = ([leftPipette, rightPipette]).reduce(
      (acc: {[string]: PipetteData}, pipette: ?PipetteData) => {
        if (!pipette) return acc
        return {
          ...acc,
          [pipette.id]: pipette,
        }
      }, {})

    return {
      ...state,
      ...newPipettes,
    }
  },
  SWAP_PIPETTES: (
    state: PipetteById,
    action: {payload: NewProtocolFields}
  ): PipetteById => {
    return mapValues(state, (pipette: PipetteData): PipetteData => ({
      ...pipette,
      mount: (pipette.mount === 'left') ? 'right' : 'left',
    }))
  },
}, {})

const byMount = handleActions({
  LOAD_FILE: (state: PipetteIdByMount, action: LoadFileAction): PipetteIdByMount => {
    const file = action.payload
    const {pipettes} = file
    // TODO: Ian 2018-06-29 create fns to access ProtocolFile data
    const pipetteIds = Object.keys(pipettes)
    return {
      left: pipetteIds.find(id => pipettes[id].mount === 'left'),
      right: pipetteIds.find(id => pipettes[id].mount === 'right'),
    }
  },
  UPDATE_PIPETTES: (state: PipetteReducerState, action: UpdatePipetteAction) => action.payload.byMount,
  CREATE_NEW_PROTOCOL: (
    state: PipetteIdByMount,
    action: {payload: NewProtocolFields}
  ): PipetteIdByMount => {
    const {left, right} = action.payload

    const leftPipette = (left.pipetteModel && left.tiprackModel)
      ? createPipette('left', left.pipetteModel, left.tiprackModel)
      : null

    const rightPipette = (right.pipetteModel && right.tiprackModel)
      ? createPipette('right', right.pipetteModel, right.tiprackModel)
      : null

    return {
      left: leftPipette ? leftPipette.id : state.left,
      right: rightPipette ? rightPipette.id : state.right,
    }
  },
  SWAP_PIPETTES: (state: PipetteIdByMount, action: {payload: NewProtocolFields}): PipetteIdByMount => ({
    left: state.right,
    right: state.left,
  }),
}, {left: null, right: null})

const _allReducers = {
  byMount,
  byId,
}

export type RootState = {
  byId: PipetteById,
  byMount: PipetteIdByMount,
}

export const rootReducer = combineReducers(_allReducers)
