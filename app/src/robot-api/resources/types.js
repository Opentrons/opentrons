/* eslint-disable no-use-before-define */
// @flow
// DEPRECATED
// do not add to this file
// do not import from this file if you can avoid it

// modules
// TODO(mc, 2019-04-25): normalize?
export type ModulesState = Array<Module>

export type Module = MagDeckModule | TempDeckModule | ThermocyclerModule

export type BaseModule = {|
  model: string,
  serial: string,
  fwVersion: string,
  status: string,
|}

export type TempDeckModule = {|
  ...BaseModule,
  name: 'tempdeck',
  displayName: 'Temperature Module',
  data: TempDeckData,
|}

export type MagDeckModule = {|
  ...BaseModule,
  name: 'magdeck',
  displayName: 'Magnetic Bead Module',
  data: MagDeckData,
|}

export type TempDeckData = {|
  currentTemp: number,
  targetTemp: number,
  lidTarget: typeof undefined,
  lidTemp: typeof undefined,
|}

export type MagDeckData = {|
  engaged: boolean,
|}

export type ThermocyclerData = {|
  lid: 'open' | 'closed' | 'in_between',
  lidTarget: ?number,
  lidTemp: number,
  currentTemp: number,
  targetTemp: ?number,
  holdTime: ?number,
  rampRate: ?number,
  totalStepCount: ?number,
  currentStepIndex: ?number,
  totalCycleCount: ?number,
  currentCycleIndex: ?number,
|}

export type ThermocyclerModule = {|
  ...BaseModule,
  name: 'thermocycler',
  displayName: 'Thermocycler Module',
  data: ThermocyclerData,
|}

export type ModuleCommand =
  | 'set_temperature'
  | 'set_block_temperature'
  | 'set_lid_temperature'
  | 'deactivate'
  | 'open'
export type ModuleCommandRequest = {|
  command_type: ModuleCommand,
  args?: Array<number>,
|}
