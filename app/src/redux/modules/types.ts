// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  TemperatureModuleModel,
  ThermocyclerModuleModel,
  MagneticModuleModel,
} from '@opentrons/shared-data'

import {
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import * as ApiTypes from './api-types'
export * from './api-types'

// common types

export type CommonModuleInfo = $Diff<
  ApiTypes.ApiBaseModule,
  {| model: mixed, displayName: mixed, moduleModel: mixed |}
>

export type TemperatureModule = {|
  type: typeof TEMPERATURE_MODULE_TYPE,
  model: TemperatureModuleModel,
  status: ApiTypes.TemperatureStatus,
  data: ApiTypes.TemperatureData,
  ...CommonModuleInfo,
|}

export type MagneticModule = {|
  type: typeof MAGNETIC_MODULE_TYPE,
  model: MagneticModuleModel,
  status: ApiTypes.MagneticStatus,
  data: ApiTypes.MagneticData,
  ...CommonModuleInfo,
|}

export type ThermocyclerModule = {|
  type: typeof THERMOCYCLER_MODULE_TYPE,
  model: ThermocyclerModuleModel,
  status: ApiTypes.ThermocyclerStatus,
  data: ApiTypes.ThermocyclerData,
  ...CommonModuleInfo,
|}

export type AttachedModule =
  | TemperatureModule
  | MagneticModule
  | ThermocyclerModule
// action object types

// fetch modules

export type FetchModulesAction = {|
  type: 'modules:FETCH_MODULES',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchModulesSuccessAction = {|
  type: 'modules:FETCH_MODULES_SUCCESS',
  payload: {| robotName: string, modules: Array<AttachedModule> |},
  meta: RobotApiRequestMeta,
|}

export type FetchModulesFailureAction = {|
  type: 'modules:FETCH_MODULES_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

// fetch module data

export type SendModuleCommandAction = {|
  type: 'modules:SEND_MODULE_COMMAND',
  payload: {|
    robotName: string,
    moduleId: string,
    command: ApiTypes.ModuleCommand,
    args: Array<mixed>,
  |},
  meta: RobotApiRequestMeta,
|}

export type SendModuleCommandSuccessAction = {|
  type: 'modules:SEND_MODULE_COMMAND_SUCCESS',
  payload: {|
    robotName: string,
    moduleId: string,
    command: ApiTypes.ModuleCommand,
    returnValue: mixed,
  |},
  meta: RobotApiRequestMeta,
|}

export type SendModuleCommandFailureAction = {|
  type: 'modules:SEND_MODULE_COMMAND_FAILURE',
  payload: {|
    robotName: string,
    moduleId: string,
    command: ApiTypes.ModuleCommand,
    error: {},
  |},
  meta: RobotApiRequestMeta,
|}

// fetch modules

export type UpdateModuleAction = {|
  type: 'modules:UPDATE_MODULE',
  payload: {| robotName: string, moduleId: string |},
  meta: RobotApiRequestMeta,
|}

export type UpdateModuleSuccessAction = {|
  type: 'modules:UPDATE_MODULE_SUCCESS',
  payload: {|
    robotName: string,
    moduleId: string,
    message: string,
  |},
  meta: RobotApiRequestMeta,
|}

export type UpdateModuleFailureAction = {|
  type: 'modules:UPDATE_MODULE_FAILURE',
  payload: {|
    robotName: string,
    moduleId: string,
    error: {},
  |},
  meta: RobotApiRequestMeta,
|}

// action union

export type ModulesAction =
  | FetchModulesAction
  | FetchModulesSuccessAction
  | FetchModulesFailureAction
  | SendModuleCommandAction
  | SendModuleCommandSuccessAction
  | SendModuleCommandFailureAction
  | UpdateModuleAction
  | UpdateModuleSuccessAction
  | UpdateModuleFailureAction

// state types

export type AttachedModulesById = $Shape<
  $ReadOnly<{| [moduleId: string]: AttachedModule |}>
>

export type PerRobotModulesState = $ReadOnly<{|
  modulesById: AttachedModulesById | null,
|}>

export type ModulesState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotModulesState,
  |}>
>
