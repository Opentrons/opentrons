// @flow
import * as React from 'react'

export type FileUploadErrorType =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON_FILE'

export type ModalContents = {
  title: string,
  body: React.Node
}
