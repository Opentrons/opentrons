// @flow
import type {FilePageFieldAccessors} from './types'

export const updateFileField = (accessor: FilePageFieldAccessors, value: string) => ({
  type: 'UPDATE_FILE_FIELD',
  payload: {
    accessor,
    value
  }
})
