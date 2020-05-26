// @flow
// robot redux module constants
import type { Mount, Slot } from './types'

export const _NAME = 'robot'

// connection states
export const DISCONNECTED: 'disconnected' = 'disconnected'
export const CONNECTING: 'connecting' = 'connecting'
export const CONNECTED: 'connected' = 'connected'
export const DISCONNECTING: 'disconnecting' = 'disconnecting'

// session status (api/opentrons/api/session.py::VALID_STATES)
export const LOADED: 'loaded' = 'loaded'
export const RUNNING: 'running' = 'running'
export const FINISHED: 'finished' = 'finished'
export const STOPPED: 'stopped' = 'stopped'
export const PAUSED: 'paused' = 'paused'
export const ERROR: 'error' = 'error'

// labware confirmation states
// TODO(mc, 2018-01-11): remove constant exports in favor of types.js
export const UNCONFIRMED: 'unconfirmed' = 'unconfirmed'
export const MOVING_TO_SLOT: 'moving-to-slot' = 'moving-to-slot'
export const JOGGING: 'jogging' = 'jogging'
export const DROPPING_TIP: 'dropping-tip' = 'dropping-tip'
export const OVER_SLOT: 'over-slot' = 'over-slot'
export const PICKING_UP: 'picking-up' = 'picking-up'
export const PICKED_UP: 'picked-up' = 'picked-up'
export const CONFIRMING: 'confirming' = 'confirming'
export const CONFIRMED: 'confirmed' = 'confirmed'

// door states
export const DOOR_OPEN: 'open' = 'open'
export const DOOR_CLOSED: 'closed' = 'closed'

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
