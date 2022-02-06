// common types

interface ProtocolFileProps {
  filename: string
  modified: number
}

interface ValidatedProtocolProps extends ProtocolFileProps {
  file: string // TODO: type file properly
}

export interface UncheckedProtocolFile extends ProtocolFileProps {
  data: { [key: string]: unknown } | null
}

export interface InvalidProtocolFile extends ProtocolFileProps {
  type: 'INVALID_LABWARE_FILE'
}

export interface DuplicateProtocolFile extends ValidatedProtocolProps {
  type: 'DUPLICATE_LABWARE_FILE'
}

export interface OpentronsProtocolFile extends ValidatedProtocolProps {
  type: 'OPENTRONS_LABWARE_FILE'
}

export interface ValidProtocolFile extends ValidatedProtocolProps {
  type: 'VALID_LABWARE_FILE'
}

export type CheckedProtocolFile =
  | InvalidProtocolFile
  | DuplicateProtocolFile
  | OpentronsProtocolFile
  | ValidProtocolFile

export type FailedProtocolFile =
  | InvalidProtocolFile
  | DuplicateProtocolFile
  | OpentronsProtocolFile

// state types

export interface ProtocolStorageState {
  readonly filenames: string[]
  readonly filesByName: Partial<{ [filename: string]: CheckedProtocolFile }>
  readonly addFailureFile: FailedProtocolFile | null
  readonly addFailureMessage: string | null
  readonly listFailureMessage: string | null
}

// action types

export type ProtocolListActionSource =
  | 'poll'
  | 'initial'
  | 'protocolAddition'
  | 'overwriteProtocol'

export interface FetchProtocolAction {
  type: 'protocolStorage:FETCH_PROTOCOL'
  meta: { shell: true }
}

export interface ProtocolListAction {
  type: 'protocolStorage:PROTOCOL_LIST'
  payload: CheckedProtocolFile[]
  meta: { source: ProtocolListActionSource }
}

export interface ProtocolListFailureAction {
  type: 'protocolStorage:PROTOCOL_LIST_FAILURE'
  payload: { message: string }
  meta: { source: ProtocolListActionSource }
}

export interface AddProtocolAction {
  type: 'protocolStorage:ADD_PROTOCOL'
  payload: { overwrite: DuplicateProtocolFile | null }
  meta: { shell: true }
}

export interface AddProtocolFailureAction {
  type: 'protocolStorage:ADD_PROTOCOL_FAILURE'
  payload: { protocol: FailedProtocolFile | null; message: string | null }
}

export interface ClearAddProtocolFailureAction {
  type: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE'
}

export interface OpenProtocolDirectoryAction {
  type: 'protocolStorage:OPEN_PROTOCOL_DIRECTORY'
  meta: { shell: true }
}

export type ProtocolStorageAction =
  | FetchProtocolAction
  | ProtocolListAction
  | ProtocolListFailureAction
  | AddProtocolAction
  | AddProtocolFailureAction
  | ClearAddProtocolFailureAction
  | OpenProtocolDirectoryAction
