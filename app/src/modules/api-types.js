// @flow

import {
  type MagneticModuleModel,
  type ModuleModel,
  type TemperatureModuleModel,
  type ThermocyclerModuleModel,
  typeof MAGDECK,
  typeof TEMPDECK,
  typeof THERMOCYCLER,
} from '@opentrons/shared-data'

export type ApiBaseModule = {|
  displayName: string,
  serial: string,
  revision: string,
  model: string,
  moduleModel: ModuleModel,
  fwVersion: string,
  port: string,
  hasAvailableUpdate: boolean,
|}

type ApiBaseModuleLegacy = {|
  displayName: string,
  serial: string,
  model: string,
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

export type ApiTemperatureModule = {|
  ...ApiBaseModule,
  moduleModel: TemperatureModuleModel,
  name: TEMPDECK,
  data: TemperatureData,
  status: TemperatureStatus,
|}

export type ApiTemperatureModuleLegacy = {|
  ...ApiBaseModuleLegacy,
  name: TEMPDECK,
  data: TemperatureData,
  status: TemperatureStatus,
|}

export type ApiMagneticModule = {|
  ...ApiBaseModule,
  moduleModel: MagneticModuleModel,
  name: MAGDECK,
  data: MagneticData,
  status: MagneticStatus,
|}

export type ApiMagneticModuleLegacy = {|
  ...ApiBaseModuleLegacy,
  name: MAGDECK,
  data: MagneticData,
  status: MagneticStatus,
|}

export type ApiThermocyclerModule = {|
  ...ApiBaseModule,
  moduleModel: ThermocyclerModuleModel,
  name: THERMOCYCLER,
  data: ThermocyclerData,
  status: ThermocyclerStatus,
|}

export type ApiThermocyclerModuleLegacy = {|
  ...ApiBaseModuleLegacy,
  name: THERMOCYCLER,
  data: ThermocyclerData,
  status: ThermocyclerStatus,
|}

export type ApiAttachedModule =
  | ApiThermocyclerModule
  | ApiMagneticModule
  | ApiTemperatureModule

export type ApiAttachedModuleLegacy =
  | ApiThermocyclerModuleLegacy
  | ApiTemperatureModuleLegacy
  | ApiMagneticModuleLegacy

export type ModuleCommand =
  | 'set_temperature'
  | 'set_block_temperature'
  | 'set_lid_temperature'
  | 'deactivate'
  | 'open'
