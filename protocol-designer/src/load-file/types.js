// @flow
import type {ProtocolFile} from '../file-types'

export type FileUploadErrorType =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON_FILE'

export type FileError = {
    errorType: FileUploadErrorType,
    message?: string,
  } | null

export type PipetteFields = {
  pipetteModel: string,
  tiprackModel: ?string,
}

export type NewProtocolFields = {|
  name: ?string,
  left: PipetteFields,
  right: PipetteFields,
|}

export type LoadFileAction = {
  type: 'LOAD_FILE',
  payload: ProtocolFile,
}

export type CreateNewProtocolAction = {
  type: 'CREATE_NEW_PROTOCOL',
  payload: {
    ...NewProtocolFields,
    tipracks: Array<{id: string, model: string}>,
  },
}
