// @flow
import type {ProtocolFile} from '../file-types'

export const LOAD_FILE: 'LOAD_FILE' = 'LOAD_FILE'
// expects valid, parsed JSON protocol.
export const loadFile = (payload: ProtocolFile) => ({
  type: LOAD_FILE,
  payload
})
