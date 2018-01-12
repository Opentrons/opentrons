// @flow
// robot redux module constants
import PropTypes from 'prop-types'

export const _NAME = 'robot'

// connection states
// TODO(mc, 2018-01-11): remove constant exports in favor of flowtype
export const DISCONNECTED = 'disconnected'
export const CONNECTING = 'connecting'
export const CONNECTED = 'connected'
export const DISCONNECTING = 'disconnecting'
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'

// session status (api/opentrons/api/session.py::VALID_STATES)
export type SessionStatus =
  | ''
  | 'loaded'
  | 'running'
  | 'paused'
  | 'error'
  | 'finished'
  | 'stopped'

// tip probe calibration states
export const UNPROBED = 'unprobed'
export const PREPARING_TO_PROBE = 'preparing-to-probe'
export const READY_TO_PROBE = 'ready-to-probe'
export const PROBING = 'probing'
export const PROBED = 'probed'
export const INSTRUMENT_CALIBRATION_TYPE = PropTypes.oneOf([
  UNPROBED,
  PREPARING_TO_PROBE,
  READY_TO_PROBE,
  PROBING,
  PROBED
])

// labware confirmation states
// several are redundant and could be collapsed into something like MOVING
export const UNCONFIRMED = 'unconfirmed'
export const MOVING_TO_SLOT = 'moving-to-slot'
export const OVER_SLOT = 'over-slot'
export const PICKING_UP = 'picking-up'
export const HOMING = 'homing'
export const HOMED = 'homed'
export const UPDATING = 'updating'
export const UPDATED = 'updated'
export const CONFIRMING = 'confirming'
export const CONFIRMED = 'confirmed'
export const LABWARE_CONFIRMATION_TYPE = PropTypes.oneOf([
  UNCONFIRMED,
  MOVING_TO_SLOT,
  OVER_SLOT,
  PICKING_UP,
  HOMING,
  HOMED,
  UPDATING,
  UPDATED,
  CONFIRMING,
  CONFIRMED
])

// deck layout
export type InstrumentMount = 'left' | 'right'
export const INSTRUMENT_AXES: InstrumentMount[] = ['left', 'right']
export const DECK_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// pipette channels
export const SINGLE_CHANNEL = 'single'
export const MULTI_CHANNEL = 'multi'

// jogging
export const JOG_DIRECTION_NEG = -1
export const JOG_DIRECTION_POS = 1
export const JOG_DISTANCE_SLOW_MM = 0.25
export const JOG_DISTANCE_FAST_MM = 4
