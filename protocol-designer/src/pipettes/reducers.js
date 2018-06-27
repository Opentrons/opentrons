// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import {pipetteDataByName, type PipetteName} from './pipetteData'
import {updatePipettes} from './actions'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'

function createPipette (name: PipetteName, mount: Mount, tiprackModel: string): PipetteData {
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

type PipetteReducerState = {
  byMount: {|
    left: ?string,
    right: ?string
  |},
  byId: {
    [pipetteId: string]: PipetteData
  }
}

const pipettes = handleActions({
  UPDATE_PIPETTES: (state: PipetteReducerState, action: ActionType<typeof updatePipettes>) => {
    const {left, right, leftTiprackModel, rightTiprackModel} = action.payload

    const leftPipette = (left && leftTiprackModel)
      ? createPipette(left, 'left', leftTiprackModel)
      : null

    const rightPipette = (right && rightTiprackModel)
      ? createPipette(right, 'right', rightTiprackModel)
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
