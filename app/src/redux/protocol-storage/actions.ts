import * as Types from './types'

// action type literals

export const FETCH_PROTOCOL: 'protocolStorage:FETCH_PROTOCOL' =
  'protocolStorage:FETCH_PROTOCOL'

export const PROTOCOL_LIST: 'protocolStorage:PROTOCOL_LIST' =
  'protocolStorage:PROTOCOL_LIST'

export const PROTOCOL_LIST_FAILURE: 'protocolStorage:PROTOCOL_LIST_FAILURE' =
  'protocolStorage:PROTOCOL_LIST_FAILURE'

export const ADD_PROTOCOL: 'protocolStorage:ADD_PROTOCOL' =
  'protocolStorage:ADD_PROTOCOL'

export const ADD_PROTOCOL_FAILURE: 'protocolStorage:ADD_PROTOCOL_FAILURE' =
  'protocolStorage:ADD_PROTOCOL_FAILURE'

export const CLEAR_ADD_PROTOCOL_FAILURE: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE' =
  'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE'

export const OPEN_PROTOCOL_DIRECTORY: 'protocolStorage:OPEN_PROTOCOL_DIRECTORY' =
  'protocolStorage:OPEN_PROTOCOL_DIRECTORY'

// action meta literals

export const POLL = 'poll' as const
export const INITIAL = 'initial' as const
export const PROTOCOL_ADDITION = 'protocolAddition' as const
export const OVERWRITE_PROTOCOL = 'overwriteProtocol' as const

// action creators

export const fetchProtocol = (): Types.FetchProtocolAction => ({
  type: FETCH_PROTOCOL,
  meta: { shell: true },
})

export const protocolList = (
  payload: Types.CheckedProtocolFile[],
  source: Types.ProtocolListActionSource = POLL
): Types.ProtocolListAction => ({
  type: PROTOCOL_LIST,
  payload,
  meta: { source },
})

export const protocolListFailure = (
  message: string,
  source: Types.ProtocolListActionSource = POLL
): Types.ProtocolListFailureAction => ({
  type: PROTOCOL_LIST_FAILURE,
  payload: { message },
  meta: { source },
})

export const addProtocol = (
  overwrite: Types.DuplicateProtocolFile | null = null
): Types.AddProtocolAction => ({
  type: ADD_PROTOCOL,
  payload: { overwrite },
  meta: { shell: true },
})

export const addProtocolFailure = (
  protocol: Types.FailedProtocolFile | null = null,
  message: string | null = null
): Types.AddProtocolFailureAction => ({
  type: ADD_PROTOCOL_FAILURE,
  payload: { protocol, message },
})

export const clearAddProtocolFailure = (): Types.ClearAddProtocolFailureAction => ({
  type: CLEAR_ADD_PROTOCOL_FAILURE,
})

export const openProtocolDirectory = (): Types.OpenProtocolDirectoryAction => ({
  type: OPEN_PROTOCOL_DIRECTORY,
  meta: { shell: true },
})
