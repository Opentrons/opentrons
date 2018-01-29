// @flow
// common robot types

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

// robot MDNS service for connectivity
export type RobotService = {
  name: string,
  host: string,
  ip: string,
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
  | 'over-slot'
  | 'picking-up'
  | 'homing'
  | 'homed'
  | 'updating'
  | 'updated'
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

// instrument as returned by the robot API
export type Instrument = {
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

// labware as returned by the robot API
export type Labware = {
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
  calibratorMount: ?Mount,
}
