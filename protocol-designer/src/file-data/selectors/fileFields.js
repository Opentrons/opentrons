// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import type {DropdownOption} from '@opentrons/components'
import type {PipetteData} from '../../step-generation'
import type {BaseState} from '../../types'
import type {RootState} from '../reducers'

export const rootSelector = (state: BaseState): RootState => state.fileData

export const fileFormValues = createSelector(
  rootSelector,
  state => state.metadataFields
)

// TODO Ian 2018-03-01 develop out Pipette ID generation
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
