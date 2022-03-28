import type { LabwareDefinition2 } from '@opentrons/shared-data'

// common types

interface LabwareFileProps {
  filename: string
  modified: number
}

interface ValidatedLabwareProps extends LabwareFileProps {
  definition: LabwareDefinition2
}

export interface UncheckedLabwareFile extends LabwareFileProps {
  data: { [key: string]: unknown } | null
}

export interface InvalidLabwareFile extends LabwareFileProps {
  type: 'INVALID_LABWARE_FILE'
}

export interface DuplicateLabwareFile extends ValidatedLabwareProps {
  type: 'DUPLICATE_LABWARE_FILE'
}

export interface OpentronsLabwareFile extends ValidatedLabwareProps {
  type: 'OPENTRONS_LABWARE_FILE'
}

export interface ValidLabwareFile extends ValidatedLabwareProps {
  type: 'VALID_LABWARE_FILE'
}

export type CheckedLabwareFile =
  | InvalidLabwareFile
  | DuplicateLabwareFile
  | OpentronsLabwareFile
  | ValidLabwareFile

export type FailedLabwareFile =
  | InvalidLabwareFile
  | DuplicateLabwareFile
  | OpentronsLabwareFile

// state types

export interface CustomLabwareState {
  readonly filenames: string[]
  readonly filesByName: Partial<{ [filename: string]: CheckedLabwareFile }>
  readonly addFailureFile: FailedLabwareFile | null
  readonly addFailureMessage: string | null
  readonly listFailureMessage: string | null
  readonly newLabwareName: string | null
}

// action types

export type CustomLabwareListActionSource =
  | 'poll'
  | 'initial'
  | 'addLabware'
  | 'overwriteLabware'
  | 'changeDirectory'

export interface FetchCustomLabwareAction {
  type: 'labware:FETCH_CUSTOM_LABWARE'
  meta: { shell: true }
}

export interface CustomLabwareListAction {
  type: 'labware:CUSTOM_LABWARE_LIST'
  payload: CheckedLabwareFile[]
  meta: { source: CustomLabwareListActionSource }
}

export interface CustomLabwareListFailureAction {
  type: 'labware:CUSTOM_LABWARE_LIST_FAILURE'
  payload: { message: string }
  meta: { source: CustomLabwareListActionSource }
}

export interface ChangeCustomLabwareDirectoryAction {
  type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY'
  meta: { shell: true }
}

export interface AddCustomLabwareAction {
  type: 'labware:ADD_CUSTOM_LABWARE'
  payload: { overwrite: DuplicateLabwareFile | null }
  meta: { shell: true }
}

export interface AddCustomLabwareFileAction {
  type: 'labware:ADD_CUSTOM_LABWARE_FILE'
  payload: { filePath: string }
  meta: { shell: true }
}

export interface AddCustomLabwareFailureAction {
  type: 'labware:ADD_CUSTOM_LABWARE_FAILURE'
  payload: { labware: FailedLabwareFile | null; message: string | null }
}

export interface ClearAddCustomLabwareFailureAction {
  type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE'
}

export interface AddNewLabwareNameAction {
  type: 'labware:ADD_NEW_LABWARE_NAME'
  payload: { filename: string }
}

export interface ClearNewLabwareNameAction {
  type: 'labware:CLEAR_NEW_LABWARE_NAME'
}

export interface OpenCustomLabwareDirectoryAction {
  type: 'labware:OPEN_CUSTOM_LABWARE_DIRECTORY'
  meta: { shell: true }
}

export type CustomLabwareAction =
  | FetchCustomLabwareAction
  | CustomLabwareListAction
  | CustomLabwareListFailureAction
  | ChangeCustomLabwareDirectoryAction
  | AddCustomLabwareAction
  | AddCustomLabwareFileAction
  | AddCustomLabwareFailureAction
  | ClearAddCustomLabwareFailureAction
  | AddNewLabwareNameAction
  | ClearNewLabwareNameAction
  | OpenCustomLabwareDirectoryAction
