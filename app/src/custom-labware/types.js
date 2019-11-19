// @flow

import type { LabwareMetadata } from '@opentrons/shared-data'

export type LabwareIdentity = {|
  name: string,
  namespace: string,
  version: number,
|}

type LabwareFileProps = {|
  filename: string,
  created: number,
|}

type ValidatedLabwareProps = {|
  ...LabwareFileProps,
  identity: LabwareIdentity,
  metadata: LabwareMetadata,
|}

export type UncheckedLabwareFile = {|
  ...LabwareFileProps,
  data: { [string]: mixed } | null,
|}

export type BadJsonLabwareFile = {|
  type: 'BAD_JSON_LABWARE_FILE',
  ...LabwareFileProps,
|}

export type InvalidLabwareFile = {|
  type: 'INVALID_LABWARE_FILE',
  ...LabwareFileProps,
|}

export type DuplicateLabwareFile = {|
  type: 'DUPLICATE_LABWARE_FILE',
  ...ValidatedLabwareProps,
|}

export type OpentronsLabwareFile = {|
  type: 'OPENTRONS_LABWARE_FILE',
  ...ValidatedLabwareProps,
|}

export type ValidLabwareFile = {|
  type: 'VALID_LABWARE_FILE',
  ...ValidatedLabwareProps,
|}

export type CheckedLabwareFile =
  | BadJsonLabwareFile
  | InvalidLabwareFile
  | DuplicateLabwareFile
  | OpentronsLabwareFile
  | ValidLabwareFile

export type CustomLabwareState = $ReadOnly<{|
  filenames: Array<string>,
  filesByName: $Shape<{| [filename: string]: CheckedLabwareFile |}>,
|}>

export type CustomLabwareAction =
  | {| type: 'labware:FETCH_CUSTOM_LABWARE', meta: {| shell: true |} |}
  | {| type: 'labware:CUSTOM_LABWARE', payload: Array<CheckedLabwareFile> |}
  | {|
      type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
      meta: {| shell: true |},
    |}
  | {| type: 'labware:ADD_CUSTOM_LABWARE', meta: {| shell: true |} |}
