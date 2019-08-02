/* eslint-disable no-use-before-define */
// @flow
// resource model types

// health
export type HealthState = {|
  name: string,
  api_version: string,
  fw_version: string,
  logs: ?Array<string>,
|} | null

// modules
// TODO(mc, 2019-04-25): normalize?
export type ModulesState = Array<Module>

export type Module = MagDeckModule | TempDeckModule

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
|}

export type MagDeckData = {|
  engaged: boolean,
|}

export type ThermocyclerData = {|
  lid: 'open' | 'closed',
  lidTarget: ?number,
  lidTemp: number,
  currentTemp: number,
  targetTemp: ?number,
  holdTime: ?number,
  rampRate: ?number,
|}

export type ThermocyclerModule = {|
  ...BaseModule,
  name: 'thermocycler',
  displayName: 'Thermocycler Module',
  data: ThermocyclerData,
|}

export type ModuleCommandRequest = {|
  command_type: 'set_temperature' | 'deactivate',
  args?: Array<number>,
|}

// pipettes
export type PipettesState = {|
  right: Pipette | null,
  left: Pipette | null,
|}

export type Pipette = {|
  id: ?string,
  name: ?string,
  model: ?string,
  mount_axis: MotorAxis,
  plunger_axis: MotorAxis,
|}

export type MotorAxis = 'a' | 'b' | 'c' | 'x' | 'y' | 'z'

// settings
export type SettingsState = {|
  robot: RobotSettings,
  pipettesById: {| [id: string]: PipetteSettings |},
|}

export type RobotSettings = Array<RobotSettingsField>

export type PipetteSettings = {|
  info: {| name: ?string, model: ?string |},
  fields: PipetteSettingsFieldsMap,
|}

export type RobotSettingsField = {|
  id: string,
  title: string,
  description: string,
  value: boolean | null,
|}

export type RobotSettingsFieldUpdate = {|
  id: $PropertyType<RobotSettingsField, 'id'>,
  value: $PropertyType<RobotSettingsField, 'value'>,
|}

export type PipetteSettingsFieldsMap = {|
  [fieldId: string]: PipetteSettingsField,
  quirks?: PipetteQuirksField,
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

export type PipetteSettingsUpdate = {|
  fields: {|
    [id: string]: null | {| value: number |},
  |},
|}
