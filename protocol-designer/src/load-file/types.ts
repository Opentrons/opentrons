import { PDProtocolFile } from '../file-types'
import type { RobotType } from '@opentrons/shared-data'

export type FileUploadErrorType = 'INVALID_FILE_TYPE' | 'INVALID_JSON_FILE'
export type FileUploadMessageKey = 'DID_MIGRATE'
export type FileUploadMessage =
  | {
      isError: false
      messageKey: FileUploadMessageKey
      migrationsRan: string[]
    }
  | {
      isError: true
      errorType: FileUploadErrorType
      errorMessage?: string
    }
export interface NewProtocolFields {
  name: string | null | undefined
  description: string | null | undefined
  organizationOrAuthor: string | null | undefined
  robotType: RobotType
}
export interface LoadFileAction {
  type: 'LOAD_FILE'
  payload: {
    file: PDProtocolFile
    didMigrate: boolean
    migrationsRan: string[]
  }
}
