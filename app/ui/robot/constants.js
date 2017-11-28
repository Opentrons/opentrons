// robot redux module constants
import PropTypes from 'prop-types'

export const _NAME = 'robot'

// connection states
export const DISCONNECTED = 'disconnected'
export const CONNECTING = 'connecting'
export const CONNECTED = 'connected'
export const DISCONNECTING = 'disconnecting'

// session states
export const LOADED = 'loaded'
export const RUNNING = 'running'
export const PAUSED = 'paused'
export const ERROR = 'error'
export const FINISHED = 'finished'
export const STOPPED = 'stopped'

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
export const UNCONFIRMED = 'unconfirmed'
export const MOVING_TO_SLOT = 'moving-to-slot'
export const OVER_SLOT = 'over-slot'
export const PICKING_UP = 'picking-up'
export const HOMING = 'homing'
export const HOMED = 'homed'
export const CONFIRMING = 'confirming'
export const CONFIRMED = 'confirmed'
export const LABWARE_CONFIRMATION_TYPE = PropTypes.oneOf([
  UNCONFIRMED,
  MOVING_TO_SLOT,
  OVER_SLOT,
  PICKING_UP,
  HOMING,
  HOMED,
  CONFIRMING,
  CONFIRMED
])

// deck layout
export const INSTRUMENT_AXES = ['left', 'right']
export const DECK_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// pipette channels
export const SINGLE_CHANNEL = 'single'
export const MULTI_CHANNEL = 'multi'

// jogging
export const JOG_DIRECTION_NEG = -1
export const JOG_DIRECTION_POS = 1
export const JOG_DISTANCE_SLOW_MM = 0.25
export const JOG_DISTANCE_FAST_MM = 4
