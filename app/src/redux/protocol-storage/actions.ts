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

export const REMOVE_PROTOCOL: 'protocolStorage:REMOVE_PROTOCOL' =
  'protocolStorage:REMOVE_PROTOCOL'

export const ADD_PROTOCOL_FAILURE: 'protocolStorage:ADD_PROTOCOL_FAILURE' =
  'protocolStorage:ADD_PROTOCOL_FAILURE'

export const CLEAR_ADD_PROTOCOL_FAILURE: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE' =
  'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE'

export const OPEN_PROTOCOL_DIRECTORY: 'protocolStorage:OPEN_PROTOCOL_DIRECTORY' =
  'protocolStorage:OPEN_PROTOCOL_DIRECTORY'

export const ANALYZE_PROTOCOL: 'protocolStorage:ANALYZE_PROTOCOL' =
  'protocolStorage:ANALYZE_PROTOCOL'

export const ANALYZE_PROTOCOL_SUCCESS: 'protocolStorage:ANALYZE_PROTOCOL_SUCCESS' =
  'protocolStorage:ANALYZE_PROTOCOL_SUCCESS'

export const ANALYZE_PROTOCOL_FAILURE: 'protocolStorage:ANALYZE_PROTOCOL_FAILURE' =
  'protocolStorage:ANALYZE_PROTOCOL_FAILURE'

export const VIEW_PROTOCOL_SOURCE_FOLDER: 'protocolStorage:VIEW_PROTOCOL_SOURCE_FOLDER' =
  'protocolStorage:VIEW_PROTOCOL_SOURCE_FOLDER'

export const EDIT_PROTOCOL: 'protocolStorage:EDIT_PROTOCOL' =
  'protocolStorage:EDIT_PROTOCOL'

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
  payload: Types.StoredProtocolData[],
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

export const addProtocol = (
  protocolFilePath: string
): Types.AddProtocolAction => ({
  type: ADD_PROTOCOL,
  payload: { protocolFilePath },
  meta: { shell: true },
})

export const removeProtocol = (
  protocolKey: string
): Types.RemoveProtocolAction => ({
  type: REMOVE_PROTOCOL,
  payload: { protocolKey },
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

export const analyzeProtocol = (
  protocolKey: string
): Types.AnalyzeProtocolAction => ({
  type: ANALYZE_PROTOCOL,
  payload: { protocolKey },
  meta: { shell: true },
})

export const analyzeProtocolSuccess = (
  protocolKey: string
): Types.AnalyzeProtocolSuccessAction => ({
  type: ANALYZE_PROTOCOL_SUCCESS,
  payload: { protocolKey },
  meta: { shell: true },
})

export const analyzeProtocolFailure = (
  protocolKey: string
): Types.AnalyzeProtocolFailureAction => ({
  type: ANALYZE_PROTOCOL_FAILURE,
  payload: { protocolKey },
  meta: { shell: true },
})

export const viewProtocolSourceFolder = (
  protocolKey: string
): Types.ViewProtocolSourceFolderAction => ({
  type: VIEW_PROTOCOL_SOURCE_FOLDER,
  payload: { protocolKey },
  meta: { shell: true },
})

export const editProtocol = (
  protocolKey: string
): Types.EditProtocolAction => ({
  type: EDIT_PROTOCOL,
  payload: { protocolKey },
  meta: { shell: true },
})