// @flow
import type {FilePageFieldAccessors} from './types'
import type {PipetteName} from './pipetteData'

// NOTE: updateFileFields contains pipette name identifiers, though pipettes aren't file fields.
// This is because both pipettes and file fields can get changed in the same place
export const updateFileFields = (payload: {[accessor: FilePageFieldAccessors]: string}) => ({
  type: 'UPDATE_FILE_FIELDS',
  payload
})

export const updatePipettes = (payload: {['left' | 'right']: ?PipetteName}) => ({
  type: 'UPDATE_PIPETTES',
  payload
})
