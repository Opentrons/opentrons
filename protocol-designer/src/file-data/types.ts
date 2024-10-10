import type { ProtocolFile } from '@opentrons/shared-data'
import { StepFieldName } from '../form-types'
export type FileMetadataFields = ProtocolFile<{}>['metadata']
export type FileMetadataFieldAccessors = keyof FileMetadataFields
export interface SaveFileMetadataAction {
  type: 'SAVE_FILE_METADATA'
  payload: FileMetadataFields
}

export type FormPatch = Partial<Record<StepFieldName, unknown | null>>
export interface RenameStepAction {
  stepId?: string
  update: FormPatch
}
