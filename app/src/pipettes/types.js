// @flow

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { Pipette as ProtocolPipette } from '../robot/types'
import type { RobotApiRequestMeta } from '../robot-api/types'

// common types

export type Mount = 'left' | 'right'

export type AttachedPipette = {|
  id: string,
  name: string,
  model: string,
  tip_length: number,
  mount_axis: string,
  plunger_axis: string,
  modelSpecs: PipetteModelSpecs,
|}

export type AttachedPipettesByMount = {|
  left: null | AttachedPipette,
  right: null | AttachedPipette,
|}

export type PipetteSettingsField = {|
  value: ?number,
  default: number,
  min?: number,
  max?: number,
  units?: string,
  type?: string,
|}

export type PipetteQuirksField = {
  [quirkId: string]: boolean,
}

export type PipetteSettingsFieldsMap = {|
  [fieldId: string]: PipetteSettingsField,
  quirks?: PipetteQuirksField,
|}

export type PipetteSettings = {|
  info: {| name: ?string, model: ?string |},
  fields: PipetteSettingsFieldsMap,
|}

export type PipetteSettingsFieldsUpdate = $Shape<{|
  [fieldId: string]: number | null,
|}>

export type PipetteSettingsById = $Shape<{| [id: string]: PipetteSettings |}>

export type PipetteSettingsByMount = {|
  left: PipetteSettingsFieldsMap | null,
  right: PipetteSettingsFieldsMap | null,
|}

export type PipetteCompatibility = 'match' | 'inexact_match' | 'incompatible'

export type ProtocolPipetteInfo = {|
  actual: null | {|
    ...AttachedPipette,
    displayName: string,
    modelSpecs: ?PipetteModelSpecs,
  |},
  protocol: null | {|
    ...$Shape<$Exact<ProtocolPipette>>,
    displayName: string,
  |},
  compatibility: PipetteCompatibility,
|}

export type ProtocolPipetteInfoByMount = {|
  left: ProtocolPipetteInfo,
  right: ProtocolPipetteInfo,
|}

// API response types

export type FetchPipettesResponsePipette =
  | {|
      id: string,
      name: string,
      model: string,
      tip_length: number,
      mount_axis: string,
      plunger_axis: string,
    |}
  | {|
      id: null,
      name: null,
      model: null,
      mount_axis: string,
      plunger_axis: string,
    |}

export type FetchPipettesResponseBody = {|
  left: FetchPipettesResponsePipette,
  right: FetchPipettesResponsePipette,
|}

export type FetchPipetteSettingsResponseBody = PipetteSettingsById

// action types

// fetch pipettes

export type FetchPipettesAction = {|
  type: 'pipettes:FETCH_PIPETTES',
  payload: {| robotName: string, refresh: boolean |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipettesSuccessAction = {|
  type: 'pipettes:FETCH_PIPETTES_SUCCESS',
  payload: {| robotName: string, pipettes: FetchPipettesResponseBody |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipettesFailureAction = {|
  type: 'pipettes:FETCH_PIPETTES_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

// fetch pipette settings

export type FetchPipetteSettingsAction = {|
  type: 'pipettes:FETCH_PIPETTE_SETTINGS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipetteSettingsSuccessAction = {|
  type: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS',
  payload: {| robotName: string, settings: FetchPipetteSettingsResponseBody |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipetteSettingsFailureAction = {|
  type: 'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

// update pipette settings

export type UpdatePipetteSettingsAction = {|
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS',
  payload: {|
    robotName: string,
    pipetteId: string,
    fields: PipetteSettingsFieldsUpdate,
  |},
  meta: RobotApiRequestMeta,
|}

export type UpdatePipetteSettingsSuccessAction = {|
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS',
  payload: {|
    robotName: string,
    pipetteId: string,
    fields: PipetteSettingsFieldsMap,
  |},
  meta: RobotApiRequestMeta,
|}

export type UpdatePipetteSettingsFailureAction = {|
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE',
  payload: {| robotName: string, pipetteId: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

// pipette actions unions

export type PipettesAction =
  | FetchPipettesAction
  | FetchPipettesSuccessAction
  | FetchPipettesFailureAction
  | FetchPipetteSettingsAction
  | FetchPipetteSettingsSuccessAction
  | FetchPipetteSettingsFailureAction
  | UpdatePipetteSettingsAction
  | UpdatePipetteSettingsSuccessAction
  | UpdatePipetteSettingsFailureAction

// state types

export type PerRobotPipettesState = $ReadOnly<{|
  attachedByMount: FetchPipettesResponseBody | null,
  settingsById: FetchPipetteSettingsResponseBody | null,
|}>

export type PipettesState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotPipettesState,
  |}>
>
