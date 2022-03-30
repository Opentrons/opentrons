import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  TemperatureModuleModel,
  ThermocyclerModuleModel,
  MagneticModuleModel,
  HeaterShakerModuleModel,
} from '@opentrons/shared-data'
import type { Slot } from '../robot/api-types'

import {
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import * as ApiTypes from './api-types'
export * from './api-types'

// common types

export type CommonModuleInfo = Omit<
  ApiTypes.ApiBaseModule,
  'model' | 'displayName' | 'moduleModel'
>

export interface TemperatureModule extends CommonModuleInfo {
  type: typeof TEMPERATURE_MODULE_TYPE
  model: TemperatureModuleModel
  status: ApiTypes.TemperatureStatus
  data: ApiTypes.TemperatureData
}

export interface MagneticModule extends CommonModuleInfo {
  type: typeof MAGNETIC_MODULE_TYPE
  model: MagneticModuleModel
  status: ApiTypes.MagneticStatus
  data: ApiTypes.MagneticData
}

export interface ThermocyclerModule extends CommonModuleInfo {
  type: typeof THERMOCYCLER_MODULE_TYPE
  model: ThermocyclerModuleModel
  status: ApiTypes.ThermocyclerStatus
  data: ApiTypes.ThermocyclerData
}

export interface HeaterShakerModule extends CommonModuleInfo {
  type: typeof HEATERSHAKER_MODULE_TYPE
  model: HeaterShakerModuleModel
  status: ApiTypes.HeaterShakerStatus
  data: ApiTypes.HeaterShakerData
}

export type AttachedModule =
  | TemperatureModule
  | MagneticModule
  | ThermocyclerModule
  | HeaterShakerModule
// action object types

export interface MatchedModule {
  slot: Slot
  module: AttachedModule
}

// fetch modules

export interface FetchModulesAction {
  type: 'modules:FETCH_MODULES'
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchModulesSuccessAction {
  type: 'modules:FETCH_MODULES_SUCCESS'
  payload: { robotName: string; modules: AttachedModule[] }
  meta: RobotApiRequestMeta
}

export interface FetchModulesFailureAction {
  type: 'modules:FETCH_MODULES_FAILURE'
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

// fetch module data

export interface SendModuleCommandAction {
  type: 'modules:SEND_MODULE_COMMAND'
  payload: {
    robotName: string
    moduleId: string
    command: ApiTypes.ModuleCommand
    args: unknown[]
  }
  meta: RobotApiRequestMeta | {}
}

export interface SendModuleCommandSuccessAction {
  type: 'modules:SEND_MODULE_COMMAND_SUCCESS'
  payload: {
    robotName: string
    moduleId: string
    command: ApiTypes.ModuleCommand
    returnValue: unknown
  }
  meta: RobotApiRequestMeta
}

export interface SendModuleCommandFailureAction {
  type: 'modules:SEND_MODULE_COMMAND_FAILURE'
  payload: {
    robotName: string
    moduleId: string
    command: ApiTypes.ModuleCommand
    error: {}
  }
  meta: RobotApiRequestMeta
}

// fetch modules

export interface UpdateModuleAction {
  type: 'modules:UPDATE_MODULE'
  payload: { robotName: string; moduleId: string }
  meta: RobotApiRequestMeta | {}
}

export interface UpdateModuleSuccessAction {
  type: 'modules:UPDATE_MODULE_SUCCESS'
  payload: {
    robotName: string
    moduleId: string
    message: string
  }
  meta: RobotApiRequestMeta
}

export interface UpdateModuleFailureAction {
  type: 'modules:UPDATE_MODULE_FAILURE'
  payload: {
    robotName: string
    moduleId: string
    error: {}
  }
  meta: RobotApiRequestMeta
}

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

export type AttachedModulesById = Partial<{
  readonly [moduleId: string]: AttachedModule
}>

export interface PerRobotModulesState {
  readonly modulesById: AttachedModulesById | null
}

export type ModulesState = Partial<{
  readonly [robotName: string]: undefined | PerRobotModulesState
}>
