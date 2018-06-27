// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import {pipetteDataByName} from './pipetteData'

import type {BaseState, Selector, Options} from '../types'
import type {DropdownOption} from '@opentrons/components'
import type {PipetteData} from '../step-generation'

type PipettesById = {[pipetteId: string]: PipetteData}

const rootSelector = (state: BaseState) => state.pipettes.pipettes

function _getPipetteName (pipetteData): string {
  const result = Object.keys(pipetteDataByName).find(pipetteName => {
    const p = pipetteDataByName[pipetteName]
    return (
      p.channels === pipetteData.channels &&
      p.maxVolume === pipetteData.maxVolume
    )
  })
  if (!result) {
    console.error('_getPipetteName: No name found for given pipette')
    return '???'
  }
  return result
}

function _makePipetteOption (
  byId: PipettesById,
  pipetteId: ?string,
  idPrefix: 'left' | 'right'
): Options {
  if (!pipetteId || !byId[pipetteId]) {
    return []
  }
  const pipetteData = byId[pipetteId]
  const name = _getPipetteName(pipetteData)
  return [{
    name,
    value: idPrefix + ':' + name
  }]
}

export const equippedPipetteOptions: Selector<Array<DropdownOption>> = createSelector(
  rootSelector,
  pipettes => {
    const byId = pipettes.byId
    const leftOption = _makePipetteOption(byId, pipettes.byMount.left, 'left')
    const rightOption = _makePipetteOption(byId, pipettes.byMount.right, 'right')

    return [...leftOption, ...rightOption]
  }
)

// Shows equipped (left & right) pipettes by ID, not mount
export const equippedPipettes: Selector<PipettesById> = createSelector(
  rootSelector,
  pipettes => reduce(pipettes.byMount, (acc: PipettesById, pipetteId: string): PipettesById => {
    const pipetteData = pipettes.byId[pipetteId]
    if (!pipetteData) return acc
    return {
      ...acc,
      [pipetteId]: pipetteData
    }
  }, {})
)

// Formats pipette data specifically for instrumentgroup
export const pipettesForInstrumentGroup: Selector<*> = createSelector(
  rootSelector,
  pipettes => [pipettes.byMount.left, pipettes.byMount.right].reduce((acc, pipetteId) => {
    if (!pipetteId) return acc

    const pipetteData = pipettes.byId[pipetteId]

    if (!pipetteData) return acc

    const pipetteForInstrumentGroup = {
      mount: pipetteData.mount,
      channels: pipetteData.channels,
      description: _getPipetteName(pipetteData),
      isDisabled: false,
      tipType: `${pipetteData.maxVolume} μL`
    }

    return [...acc, pipetteForInstrumentGroup]
  }, [])
)

export const permittedTipracks: Selector<Array<string>> = createSelector(
  equippedPipettes,
  (_equippedPipettes) =>
    reduce(_equippedPipettes, (acc: Array<string>, pipette: PipetteData) => {
      return (pipette.tiprackModel)
        ? [...acc, pipette.tiprackModel]
        : acc
    }, [])
)
