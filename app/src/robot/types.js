// @flow
// common robot types

import typeof reducer from './reducer'

export type State = $Call<reducer>

export type Channels = 1 | 8

export type Mount = 'left' | 'right'

export type Slot =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'

// jog axes and directions
export type Axis = 'x' | 'y' | 'z'
export type Direction = -1 | 1
export type JogButtonName =
  | 'left'
  | 'right'
  | 'back'
  | 'forward'
  | 'up'
  | 'down'

// minimum robot for actions/reducers/middleware to work
export type BaseRobot = {
  name: string
}

// robot MDNS service for connectivity
export type RobotService = BaseRobot & {
  host: string,
  ip: string,
  port: number,
  wired?: boolean,
}

// robot from getDiscovered selector
export type Robot = RobotService & {
  isConnected: boolean
}

// protocol file (browser File object)
export type ProtocolFile = {
  name: string,
}

// TODO(mc, 2018-01-22): pay attention to this when deprecating status contants
//   in constants.js. Also re-evaluate the need for this logic / type
export type InstrumentCalibrationStatus =
  | 'unprobed'
  | 'preparing-to-probe'
  | 'ready-to-probe'
  | 'probing'
  | 'probed-tip-on'
  | 'probed'

// TODO(mc, 2018-01-11): collapse a bunch of these into something like MOVING
export type LabwareCalibrationStatus =
  | 'unconfirmed'
  | 'moving-to-slot'
  | 'jogging'
  | 'dropping-tip'
  | 'over-slot'
  | 'picking-up'
  | 'picked-up'
  | 'confirming'
  | 'confirmed'

// protocol command as returned by the API
export type Command = {
  // command identifier
  id: number,
  // user readable description of the command
  description: string,
  // timestamp of when the command was handled by the robot during a run
  handledAt: ?number,
  // subcommands
  children: number[],
}

// instrument as stored in redux state
export type StateInstrument = {
  // resource ID
  _id: number,
  // robot mount instrument is installed on
  mount: Mount,
  // number of liquid channels
  channels: Channels,
  // user-given name of the intrument
  name: string,
  // volume of the instrument
  // TODO(mc, 2018-01-17): this is used to drive tip propbe setup
  // instructions which is incorrect and needs to be rethought
  volume: number,
}

export type Instrument = StateInstrument & {
  calibration: InstrumentCalibrationStatus,
  probed: boolean,
  tipOn: boolean
}

// labware as stored in redux state
export type StateLabware = {
  // resource ID
  _id: number,
  // slot labware is installed in
  slot: Slot,
  // unique type of the labware
  type: string,
  // user defined name of the labware
  name: string,
  // whether or not the labware is a tiprack (implied from type)
  isTiprack: boolean,
  // intrument mount to use as the calibrator if isTiprack is true
  calibratorMount: ?Mount
}

export type Labware = StateLabware & {
  calibration: LabwareCalibrationStatus,
  confirmed: boolean,
  isMoving: boolean
}

export type LabwareType = 'tiprack' | 'labware'

export type SessionStatus =
  | ''
  | 'loaded'
  | 'running'
  | 'paused'
  | 'error'
  | 'finished'
  | 'stopped'
