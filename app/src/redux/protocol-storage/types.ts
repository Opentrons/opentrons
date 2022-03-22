// common types

export interface StoredProtocolDir {
  dirPath: string
  modified: number
  srcFilePaths: string[]
  analysisFilePaths: string[]
}

export interface StoredProtocolData {
  protocolKey: string
  modified: number
  srcFileNames: string[]
  mostRecentAnalysis: string | null
}

// state types

export interface ProtocolStorageState {
  readonly protocolKeys: string[]
  readonly filesByProtocolKey: {
    [protocolKey: string]: StoredProtocolData
  }
  readonly addFailureFile: StoredProtocolDir | null
  readonly addFailureMessage: string | null
  readonly listFailureMessage: string | null
}

// action types

export type ProtocolListActionSource =
  | 'poll'
  | 'initial'
  | 'protocolAddition'
  | 'overwriteProtocol'

export interface FetchProtocolsAction {
  type: 'protocolStorage:FETCH_PROTOCOLS'
  meta: { shell: true }
}

export interface UpdateProtocolListAction {
  type: 'protocolStorage:UPDATE_PROTOCOL_LIST'
  payload: StoredProtocolData[]
  meta: { source: ProtocolListActionSource }
}

export interface UpdateProtocolListFailureAction {
  type: 'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE'
  payload: { message: string }
  meta: { source: ProtocolListActionSource }
}

export interface AddProtocolAction {
  type: 'protocolStorage:ADD_PROTOCOL'
  payload: { protocolFilePath: string }
  meta: { shell: true }
}

export interface RemoveProtocolAction {
  type: 'protocolStorage:REMOVE_PROTOCOL'
  payload: { protocolKey: string }
  meta: { shell: true }
}

export interface AddProtocolFailureAction {
  type: 'protocolStorage:ADD_PROTOCOL_FAILURE'
  payload: { protocol: StoredProtocolDir | null; message: string | null }
}

export interface ClearAddProtocolFailureAction {
  type: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE'
}

export interface OpenProtocolDirectoryAction {
  type: 'protocolStorage:OPEN_PROTOCOL_DIRECTORY'
  meta: { shell: true }
}

export type ProtocolStorageAction =
  | FetchProtocolsAction
  | UpdateProtocolListAction
  | UpdateProtocolListFailureAction
  | AddProtocolAction
  | RemoveProtocolAction
  | AddProtocolFailureAction
  | ClearAddProtocolFailureAction
  | OpenProtocolDirectoryAction
