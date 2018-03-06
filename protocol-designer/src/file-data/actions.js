// @flow
import type {FilePageFieldAccessors} from './types'

export const updateFileFields = (payload: {[accessor: FilePageFieldAccessors]: string}) => ({
  type: 'UPDATE_FILE_FIELDS',
  payload: payload
})
