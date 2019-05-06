// @flow
export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
}

export type RobotApiRequest = {|
  host: RobotHost,
  method: Method,
  path: string,
  body?: mixed,
|}

export type RobotApiResponse = {|
  host: RobotHost,
  path: string,
  method: Method,
  body: any,
  status: number,
  ok: boolean,
|}

// action types

export type RobotApiAction =
  | {| type: 'robotApi:FETCH_HEALTH', payload: RobotApiRequest |}
  | {| type: 'robotApi:FETCH_MODULES', payload: RobotApiRequest |}
  | {| type: 'robotApi:FETCH_MODULE_DATA', payload: RobotApiRequest |}
  | {| type: 'robotApi:SET_MODULE_TARGET_TEMP', payload: RobotApiRequest |}

export type RobotApiActionType = $PropertyType<RobotApiAction, 'type'>

// internal, request lifecycle types
// only for use inside observables
export type RobotApiRequestAction = {|
  type: string,
  payload: RobotApiRequest,
|}

export type RobotApiResponseAction = {|
  type: string,
  payload: RobotApiResponse,
|}

export type RobotApiActionLike = {|
  type: string,
  payload: RobotApiRequest | RobotApiResponse,
|}

// resource types

export type HealthState = {|
  name: string,
  api_version: string,
  fw_version: string,
  logs: ?Array<string>,
|} | null

export type BaseModule = {|
  model: string,
  serial: string,
  fwVersion: string,
  status: string,
|}

export type TempDeckData = {|
  currentTemp: number,
  targetTemp: number,
|}

export type MagDeckData = {|
  engaged: boolean,
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

export type SetTemperatureRequest = {|
  command_type: 'set_temperature' | 'deactivate',
  args?: Array<number>,
|}

export type Module = MagDeckModule | TempDeckModule

// TODO(mc, 2019-04-25): normalize?
export type ModulesState = Array<Module>

// instance state shapes

export type RobotInstanceNetworkingState = {
  [path: string]: {| inProgress: true |},
}

export type RobotInstanceResourcesState = {|
  health: HealthState,
  modules: ModulesState,
|}

export type RobotInstanceApiState = {|
  networking: RobotInstanceNetworkingState,
  resources: RobotInstanceResourcesState,
|}

// overall API state

export type RobotApiState = {
  [robotName: string]: ?RobotInstanceApiState,
}
