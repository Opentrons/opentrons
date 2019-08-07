// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type LabwareDefByDefURI = {
  [labwareDefURI: string]: LabwareDefinition2,
}

export type LabwareUploadMessageType =
  | 'INVALID_JSON_FILE'
  | 'EXACT_LABWARE_MATCH'
  | 'LABWARE_NAME_CONFLICT'
  | 'ASK_FOR_LABWARE_OVERWRITE'

export type LabwareUploadMessage = {|
  messageType: LabwareUploadMessageType,
  message?: string,
  pendingDef?: ?LabwareDefinition2,
|}
