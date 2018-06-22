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

type Options = Array<{name: string, value: string}> // TODO IMMEDATELY import this from somewhere
function _makePipetteOption (
  byId: {[string]: PipetteData},
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

export const equippedPipetteOptions: BaseState => Array<DropdownOption> = createSelector(
  rootSelector,
  pipettes => {
    const byId = pipettes.byId
    const leftOption = _makePipetteOption(byId, pipettes.byMount.left, 'left')
    const rightOption = _makePipetteOption(byId, pipettes.byMount.right, 'right')

    return [...leftOption, ...rightOption]
  }
)

// Shows equipped (left & right) pipettes by ID, not mount
type PipettesById = {[pipetteId: string]: PipetteData}
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
export const pipettesForInstrumentGroup = createSelector(
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
      tipType: `${pipetteData.maxVolume} uL`
    }

    return [...acc, pipetteForInstrumentGroup]
  }, [])
)
