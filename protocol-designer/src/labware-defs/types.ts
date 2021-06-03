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
  | 'USES_STANDARD_NAMESPACE'

type NameConflictFields = {|
  defsMatchingLoadName: Array<LabwareDefinition2>,
  defsMatchingDisplayName: Array<LabwareDefinition2>,
  newDef: LabwareDefinition2,
|}

export type LabwareUploadMessage =
  | {|
      messageType: 'INVALID_JSON_FILE' | 'NOT_JSON',
      errorText?: string,
    |}
  | {|
      messageType:
        | 'EXACT_LABWARE_MATCH'
        | 'USES_STANDARD_NAMESPACE'
        | 'ONLY_TIPRACK',
    |}
  | {|
      ...NameConflictFields,
      messageType: 'LABWARE_NAME_CONFLICT',
    |}
  | {|
      ...NameConflictFields,
      messageType: 'ASK_FOR_LABWARE_OVERWRITE',
      defURIToOverwrite: string,
      isOverwriteMismatched: boolean, // "mismatched" if labware is significantly different than the one it is intending to replace
    |}
