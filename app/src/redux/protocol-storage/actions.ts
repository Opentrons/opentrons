import * as Types from './types'

// action type literals

export const FETCH_PROTOCOLS: 'protocolStorage:FETCH_PROTOCOLS' =
  'protocolStorage:FETCH_PROTOCOLS'

export const UPDATE_PROTOCOL_LIST: 'protocolStorage:UPDATE_PROTOCOL_LIST' =
  'protocolStorage:UPDATE_PROTOCOL_LIST'

export const UPDATE_PROTOCOL_LIST_FAILURE: 'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE' =
  'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE'

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

export const fetchProtocols = (): Types.FetchProtocolsAction => ({
  type: FETCH_PROTOCOLS,
  meta: { shell: true },
})

export const updateProtocolList = (
  payload: Types.StoredProtocolDir[],
  source: Types.ProtocolListActionSource = POLL
): Types.UpdateProtocolListAction => ({
  type: UPDATE_PROTOCOL_LIST,
  payload,
  meta: { source },
})

export const updateProtocolListFailure = (
  message: string,
  source: Types.ProtocolListActionSource = POLL
): Types.UpdateProtocolListFailureAction => ({
  type: UPDATE_PROTOCOL_LIST_FAILURE,
  payload: { message },
  meta: { source },
})

export const addProtocol = (protocolFile: File): Types.AddProtocolAction => ({
  type: ADD_PROTOCOL,
  payload: { protocolFile },
  meta: { shell: true },
})

export const addProtocolFailure = (
  protocol: Types.StoredProtocolDir | null = null,
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
