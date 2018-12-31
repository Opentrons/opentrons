// @flow
import type {ProtocolFile} from '../file-types'

export type FileUploadErrorType =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON_FILE'

export type FileError = {
    errorType: FileUploadErrorType,
    message?: string,
  } | null

export type NewProtocolFields = {|
  name: ?string,
|}

export type LoadFileAction = {
  type: 'LOAD_FILE',
  payload: ProtocolFile,
}
