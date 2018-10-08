// @flow
// robot redux module constants
import PropTypes from 'prop-types'

import type {Mount, Slot} from './types'

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
// TODO(mc, 2018-01-11): remove constant exports in favor of flowtype
export const RUNNING = 'running'
export const PAUSED = 'paused'
export const FINISHED = 'finished'

// tip probe calibration states
// TODO(mc, 2018-01-22): remove constant exports in favor of flowtype
//   see types.js
export const UNPROBED = 'unprobed'
export const PREPARING_TO_PROBE = 'preparing-to-probe'
export const READY_TO_PROBE = 'ready-to-probe'
export const PROBING = 'probing'
export const PROBED = 'probed'

// labware confirmation states
// TODO(mc, 2018-01-11): remove constant exports in favor of types.js
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
  CONFIRMED,
])

// deck layout
export const PIPETTE_MOUNTS: Array<Mount> = ['left', 'right']
export const DECK_SLOTS: Array<Slot> = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
]

// pipette channels
export const SINGLE_CHANNEL = 'single'
export const MULTI_CHANNEL = 'multi'

// jogging
export const JOG_DIRECTION_NEG = -1
export const JOG_DIRECTION_POS = 1
