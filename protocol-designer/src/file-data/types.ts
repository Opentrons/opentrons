import type { ProtocolFile } from '@opentrons/shared-data'
import type { DesignerTabPayload } from './actions'
export type FileMetadataFields = ProtocolFile<{}>['metadata']
export type FileMetadataFieldAccessors = keyof FileMetadataFields
export interface SaveFileMetadataAction {
  type: 'SAVE_FILE_METADATA'
  payload: FileMetadataFields
}

export interface SelectDesignerTabAction {
  type: 'SELECT_DESIGNER_TAB'
  payload: DesignerTabPayload
}
