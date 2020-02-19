// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'
import typeof { MAGDECK, TEMPDECK, THERMOCYCLER } from './constants'

// common types

type BaseModule = {|
  displayName: string,
  model: string,
  serial: string,
  fwVersion: string,
  port: string,
  hasAvailableUpdate: boolean,
|}

export type TemperatureData = {|
  currentTemp: number,
  targetTemp: number | null,
|}

export type MagneticData = {|
  engaged: boolean,
  height: number,
|}

export type ThermocyclerData = {|
  // TODO(mc, 2019-12-12): in_between comes from the thermocycler firmware and
  // will be rare in normal operation due to limitations in current revision
  lid: 'open' | 'closed' | 'in_between',
  lidTarget: number | null,
  lidTemp: number | null,
  currentTemp: number | null,
  targetTemp: number | null,
  holdTime: number | null,
  rampRate: number | null,
  totalStepCount: number | null,
  currentStepIndex: number | null,
  totalCycleCount: number | null,
  currentCycleIndex: number | null,
|}

export type TemperatureStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'

export type ThermocyclerStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'
  | 'error'

export type MagneticStatus = 'engaged' | 'disengaged'

export type TemperatureModule = {|
  ...BaseModule,
  name: TEMPDECK,
  data: TemperatureData,
  status: TemperatureStatus,
|}

export type MagneticModule = {|
  ...BaseModule,
  name: MAGDECK,
  data: MagneticData,
  status: MagneticStatus,
|}

export type ThermocyclerModule = {|
  ...BaseModule,
  name: THERMOCYCLER,
  data: ThermocyclerData,
  status: ThermocyclerStatus,
|}

export type AttachedModule =
  | ThermocyclerModule
  | MagneticModule
  | TemperatureModule

export type ModuleCommand =
  | 'set_temperature'
  | 'set_block_temperature'
  | 'set_lid_temperature'
  | 'deactivate'
  | 'open'

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
    command: ModuleCommand,
    args: Array<mixed>,
  |},
  meta: RobotApiRequestMeta,
|}

export type SendModuleCommandSuccessAction = {|
  type: 'modules:SEND_MODULE_COMMAND_SUCCESS',
  payload: {|
    robotName: string,
    moduleId: string,
    command: ModuleCommand,
    returnValue: mixed,
  |},
  meta: RobotApiRequestMeta,
|}

export type SendModuleCommandFailureAction = {|
  type: 'modules:SEND_MODULE_COMMAND_FAILURE',
  payload: {|
    robotName: string,
    moduleId: string,
    command: ModuleCommand,
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
