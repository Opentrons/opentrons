// @flow
// common robot types
import {
  type PipetteModelSpecs,
  type PipetteChannels,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { Mount } from '@opentrons/components'

import * as ApiTypes from './api-types'
export * from './api-types'

// TODO Ian 2018-02-27 files that import from here should just import from @opentrons/components directly
export type { Mount }

export type Channels = PipetteChannels

// jog axes and directions
// TODO(mc, 2018-05-04): deprecate in favor of types in HTTP API module
export type Axis = 'x' | 'y' | 'z'
export type Direction = -1 | 1

// TODO(mc, 2018-10-09): deprecate this type?
// minimum robot for actions/reducers/middleware to work
export type BaseRobot = {
  name: string,
}

// TODO(mc, 2018-10-09): deprecate this type
// robot MDNS service for connectivity
export type RobotService = {
  ...$Exact<BaseRobot>,
  ip: string,
  port: number,
}

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
export type StatePipette = {|
  // resource ID
  _id: number,
  // robot mount instrument is installed on
  mount: Mount,
  // number of liquid channels
  channels: Channels,
  // user-given name of the instrument
  // TODO: Ian + Mike 2018-11-06 This `name` is not what we now call the `name`,
  // rather it is the full versioned `model` of the pipette, as placed in the
  // Python Pipette's `name` field by the pipette factory functions.
  // TLDR: this `name` needs to be renamed in a future PR to `model`
  name: string,
  // tipracks the pipette uses during the protocol
  // array of RPC object IDs corresponding to `_id` field in StateLabware
  tipRacks: Array<number>,
  // string specified in protocol to load pipette
  requestedAs?: ?string,
|}

export type Pipette = {|
  ...StatePipette,
  probed: boolean,
  tipOn: boolean,
  modelSpecs: PipetteModelSpecs | null,
|}

// labware as stored in redux state
export type StateLabware = {|
  // resource ID
  _id: number,
  // slot labware is installed in
  slot: ApiTypes.Slot,
  // deck coordinates of la<bware when not in slot
  position: ?Array<number>,
  // unique type of the labware
  type: string,
  // user defined name of the labware
  name: string,
  // whether or not the labware is a tiprack (implied from type)
  isTiprack: boolean,
  // whether or not the labware is a legacy labware (labwareSchemaVersion === 1)
  isLegacy: boolean,
  // instrument mount to use as the calibrator if isTiprack is true
  calibratorMount: ?Mount,
|}

export type Labware = {|
  ...StateLabware,
  calibration: LabwareCalibrationStatus,
  confirmed: boolean,
  isMoving: boolean,
  definition: LabwareDefinition2 | null,
|}

export type LabwareType = 'tiprack' | 'labware'

export type SessionModule = $Diff<ApiTypes.ApiSessionModule, {| name: mixed |}>

export type SessionStatus =
  | ''
  | 'loaded'
  | 'running'
  | 'paused'
  | 'error'
  | 'finished'
  | 'stopped'

export type SessionUpdate = {|
  state: SessionStatus,
  startTime: ?number,
  lastCommand: ?{|
    id: number,
    handledAt: number,
  |},
|}

export type TiprackByMountMap = {|
  left: Labware | null,
  right: Labware | null,
|}
