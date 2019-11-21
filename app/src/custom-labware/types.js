// @flow

import type { LabwareMetadata } from '@opentrons/shared-data'

// common types

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
  | InvalidLabwareFile
  | DuplicateLabwareFile
  | OpentronsLabwareFile
  | ValidLabwareFile

export type FailedLabwareFile =
  | InvalidLabwareFile
  | DuplicateLabwareFile
  | OpentronsLabwareFile

// state types

export type CustomLabwareState = $ReadOnly<{|
  filenames: Array<string>,
  filesByName: $Shape<{| [filename: string]: CheckedLabwareFile |}>,
  addFailureFile: FailedLabwareFile | null,
  addFailureMessage: string | null,
  listFailureMessage: string | null,
|}>

// action types

export type FetchCustomLabwareAction = {|
  type: 'labware:FETCH_CUSTOM_LABWARE',
  meta: {| shell: true |},
|}

export type CustomLabwareListAction = {|
  type: 'labware:CUSTOM_LABWARE_LIST',
  payload: Array<CheckedLabwareFile>,
|}

export type CustomLabwareListFailureAction = {|
  type: 'labware:CUSTOM_LABWARE_LIST_FAILURE',
  payload: {| message: string |},
|}

export type ChangeCustomLabwareDirectoryAction = {|
  type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
  meta: {| shell: true |},
|}

export type AddCustomLabwareAction = {|
  type: 'labware:ADD_CUSTOM_LABWARE',
  payload: {| overwrite: DuplicateLabwareFile | null |},
  meta: {| shell: true |},
|}

export type AddCustomLabwareFailureAction = {|
  type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
  payload: {| labware: FailedLabwareFile | null, message: string | null |},
|}

export type ClearAddCustomLabwareFailureAction = {|
  type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE',
|}

export type CustomLabwareAction =
  | FetchCustomLabwareAction
  | CustomLabwareListAction
  | CustomLabwareListFailureAction
  | ChangeCustomLabwareDirectoryAction
  | AddCustomLabwareAction
  | AddCustomLabwareFailureAction
  | ClearAddCustomLabwareFailureAction
