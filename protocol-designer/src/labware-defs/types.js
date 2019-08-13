// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type LabwareDefByDefURI = {
  [labwareDefURI: string]: LabwareDefinition2,
}

export type LabwareUploadMessageType =
  | 'INVALID_JSON_FILE'
  | 'NOT_JSON'
  | 'EXACT_LABWARE_MATCH'
  | 'LABWARE_NAME_CONFLICT'
  | 'ASK_FOR_LABWARE_OVERWRITE'

export type LabwareUploadMessage =
  | {|
      messageType: 'INVALID_JSON_FILE' | 'NOT_JSON',
      errorText?: string,
      pendingDef?: ?LabwareDefinition2,
    |}
  | {|
      messageType: 'EXACT_LABWARE_MATCH',
      pendingDef?: ?LabwareDefinition2,
    |}
  | {|
      messageType: 'LABWARE_NAME_CONFLICT' | 'ASK_FOR_LABWARE_OVERWRITE',
      defsMatchingLoadName: Array<LabwareDefinition2>,
      defsMatchingDisplayName: Array<LabwareDefinition2>,
      pendingDef?: ?LabwareDefinition2,
    |}
