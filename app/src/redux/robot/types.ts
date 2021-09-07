// common robot types

import type {
  PipetteModelSpecs,
  PipetteChannels,
  LabwareDefinition2,
} from '@opentrons/shared-data'

import type { Mount } from '@opentrons/components'

import {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  DISCONNECTING,
  LOADED,
  RUNNING,
  FINISHED,
  STOPPED,
  PAUSED,
  ERROR,
  UNCONFIRMED,
  MOVING_TO_SLOT,
  JOGGING,
  DROPPING_TIP,
  OVER_SLOT,
  PICKING_UP,
  PICKED_UP,
  CONFIRMING,
  CONFIRMED,
  DOOR_OPEN,
  DOOR_CLOSED,
} from './constants'

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
export interface BaseRobot {
  name: string
}

// TODO(mc, 2018-10-09): deprecate this type
// robot MDNS service for connectivity
export interface RobotService extends BaseRobot {
  ip: string
  port: number
}

export type LabwareCalibrationStatus =
  | typeof UNCONFIRMED
  | typeof MOVING_TO_SLOT
  | typeof JOGGING
  | typeof DROPPING_TIP
  | typeof OVER_SLOT
  | typeof PICKING_UP
  | typeof PICKED_UP
  | typeof CONFIRMING
  | typeof CONFIRMED

// protocol command as returned by the API
export interface Command {
  // command identifier
  id: number
  // user readable description of the command
  description: string
  // timestamp of when the command was handled by the robot during a run
  handledAt: number | null | undefined
  // subcommands
  children: number[]
  [key: string]: unknown
}

// protocol command graph node
// contructed from Command
export interface CommandNode {
  id: number
  description: string
  handledAt: number | null | undefined
  isCurrent: boolean
  isLast: boolean
  children: CommandNode[]
}

// instrument as stored in redux state
export interface StatePipette {
  // resource ID
  _id: number
  // robot mount instrument is installed on
  mount: Mount
  // number of liquid channels
  channels: Channels
  // user-given name of the instrument
  // TODO: Ian + Mike 2018-11-06 This `name` is not what we now call the `name`,
  // rather it is the full versioned `model` of the pipette, as placed in the
  // Python Pipette's `name` field by the pipette factory functions.
  // TLDR: this `name` needs to be renamed in a future PR to `model`
  name: string
  // tipracks the pipette uses during the protocol
  // array of RPC object IDs corresponding to `_id` field in StateLabware
  tipRacks: number[]
  // string specified in protocol to load pipette
  requestedAs?: string | null | undefined
}

export interface Pipette extends StatePipette {
  probed: boolean
  tipOn: boolean
  modelSpecs: PipetteModelSpecs | null
}

// labware as stored in redux state
export interface StateLabware {
  // resource ID
  _id: number
  // slot labware is installed in
  slot: ApiTypes.Slot
  // deck coordinates of la<bware when not in slot
  position: number[] | null | undefined
  // unique type of the labware
  type: string
  // user defined name of the labware
  name: string
  // whether or not the labware is a tiprack (implied from type)
  isTiprack: boolean
  // whether or not the labware is a legacy labware (labwareSchemaVersion === 1)
  isLegacy: boolean
  // instrument mount to use as the calibrator if isTiprack is true
  calibratorMount: Mount | null | undefined
  // string identity of a labware; combines all definition properties that would effect a run
  // will be null if old RPC version or old labware version
  definitionHash: string | null
}

export interface Labware extends StateLabware {
  calibration: LabwareCalibrationStatus
  confirmed: boolean
  isMoving: boolean
  definition: LabwareDefinition2 | null
}

export type LabwareType = 'tiprack' | 'labware'

export type SessionModule = Omit<ApiTypes.ApiSessionModule, 'name'>

export type SessionStatus =
  | ''
  | typeof LOADED
  | typeof RUNNING
  | typeof FINISHED
  | typeof STOPPED
  | typeof PAUSED
  | typeof ERROR

export type ConnectionStatus =
  | typeof DISCONNECTED
  | typeof CONNECTING
  | typeof CONNECTED
  | typeof DISCONNECTING

export interface SessionStatusInfo {
  message: string | null
  changedAt: number | null
  estimatedDuration: number | null
  userMessage: string | null
}

export type DoorState = null | typeof DOOR_OPEN | typeof DOOR_CLOSED

export interface SessionUpdate {
  state: SessionStatus
  statusInfo: SessionStatusInfo
  startTime: number | null | undefined
  doorState: DoorState
  blocked: boolean
  lastCommand:
    | {
        id: number
        handledAt: number
      }
    | null
    | undefined
}

export interface TipracksByMountMap {
  left: Labware[]
  right: Labware[]
}

export interface NextTiprackPipetteInfo {
  mount: Mount
  tiprack: Labware
}
