// protocol state and loading actions
import type {
  LoadProtocolAction,
  CloseProtocolAction,
  ProtocolData,
} from './types'
import { filenameToType } from './utils'

export function loadProtocol(
  file: File,
  data: ProtocolData | null
): LoadProtocolAction {
  return {
    type: 'protocol:LOAD',
    payload: {
      file: {
        name: file.name,
        type: filenameToType(file.name),
        lastModified: file.lastModified,
      },
      data,
    },
  }
}

export function closeProtocol(): CloseProtocolAction {
  return {
    type: 'protocol:CLOSE',
  }
}
