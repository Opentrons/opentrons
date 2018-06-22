// @flow
import {createSelector} from 'reselect'
import type {BaseState, Selector} from '../types'
import reduce from 'lodash/reduce'
import type {DropdownOption} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import {pipetteDataByName} from './pipetteData'

const rootSelector = (state: BaseState) => state.pipettes.pipettes

function _getPipetteName (pipetteData) {
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

function _makePipetteOption (pipetteData: ?PipetteData, idPrefix: 'left' | 'right') {
  if (!pipetteData) {
    return []
  }
  const name = _getPipetteName(pipetteData)
  return [{
    name,
    value: idPrefix + ':' + name
  }]
}

export const equippedPipetteOptions: BaseState => Array<DropdownOption> = createSelector(
  rootSelector,
  pipettes => {
    const leftOption = _makePipetteOption(pipettes.left, 'left')
    const rightOption = _makePipetteOption(pipettes.right, 'right')

    return [...leftOption, ...rightOption]
  }
)

// TODO LATER factor out into own file
// Shows pipettes by ID, not mount
type PipettesById = {[pipetteId: string]: PipetteData}
export const equippedPipettes: Selector<PipettesById> = createSelector(
  rootSelector,
  pipettes => reduce(pipettes, (acc: PipettesById, pipetteData: ?PipetteData): PipettesById => {
    return (pipetteData)
      ? {
        ...acc,
        [pipetteData.id]: pipetteData
      }
      : acc
  }, {})
)

// Formats pipette data specifically for instrumentgroup
export const pipettesForInstrumentGroup = createSelector(
  rootSelector,
  pipettes => [pipettes.left, pipettes.right].reduce((acc, pipetteData) => pipetteData
    ? [...acc, {
      mount: pipetteData.mount,
      channels: pipetteData.channels,
      description: _getPipetteName(pipetteData),
      isDisabled: false,
      tipType: `${pipetteData.maxVolume} uL`
    }]
    : acc,
    [])
)
