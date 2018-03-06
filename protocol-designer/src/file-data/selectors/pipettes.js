// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../../types'
import reduce from 'lodash/reduce'
import type {DropdownOption} from '@opentrons/components'
import type {PipetteData} from '../../step-generation'
import {rootSelector} from './fileFields'
import {pipetteDataByName} from '../pipetteData'

export const equippedPipetteOptions: BaseState => Array<DropdownOption> = createSelector(
  rootSelector,
  s => [
    {name: s.metadataFields.leftPipette, value: 'left:' + s.metadataFields.leftPipette},
    {name: s.metadataFields.rightPipette, value: 'right:' + s.metadataFields.rightPipette}
  ].filter(option => option.name) // remove 'None' pipette
)

// TODO LATER factor out into own file
// Shows pipettes by ID, not mount
type PipettesById = {[pipetteId: string]: PipetteData}
export const equippedPipettes = createSelector(
  rootSelector,
  s => reduce(s.pipettes, (acc: PipettesById, pipetteData: ?PipetteData): PipettesById => {
    return (pipetteData)
      ? {
        ...acc,
        [pipetteData.id]: pipetteData
      }
      : acc
  }, {})
)

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

// Formats pipette data specifically for instrumentgroup
export const pipettesForInstrumentGroup = createSelector(
  rootSelector,
  s => [s.pipettes.left, s.pipettes.right].reduce((acc, pipetteData) => pipetteData
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
