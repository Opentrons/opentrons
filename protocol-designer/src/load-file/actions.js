// @flow
import type {ProtocolFile} from '../file-types'
import type {ActionType} from 'redux-actions'

// exporting these individually for easier import
export const LOAD_FILE: 'LOAD_FILE' = 'LOAD_FILE'

// expects valid, parsed JSON protocol.
export const loadFile = (payload: ProtocolFile) => ({
  type: LOAD_FILE,
  payload
})

export type LoadFileAction = ActionType<typeof loadFile>
