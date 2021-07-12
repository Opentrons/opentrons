// protocol state and loading actions
import { filenameToType } from './utils'

import type {
  LoadProtocolAction,
  CloseProtocolAction,
  ProtocolData,
} from './types'

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
