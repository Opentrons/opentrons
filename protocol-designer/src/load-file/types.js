// @flow
import type {PDProtocolFile} from '../file-types'

export type FileUploadErrorType =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON_FILE'

export type FileUploadMessageKey =
  | 'didMigrate'

export type FileUploadMessage = {
  isError: false,
  messageKey: FileUploadMessageKey,
} | {
  isError: true,
  errorType: FileUploadErrorType,
  errorMessage?: string,
}

export type NewProtocolFields = {|
  name: ?string,
|}

export type LoadFileAction = {
  type: 'LOAD_FILE',
  payload: {
    file: PDProtocolFile,
    didMigrate: boolean,
  },
}
