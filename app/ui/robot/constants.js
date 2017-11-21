// robot redux module name constant
// TODO(mc, 2017-08-29): maybe do a package.json instead?

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

// labware confirmation states
export const UNCONFIRMED = 'unconfirmed'
export const MOVING_TO_SLOT = 'moving-to-slot'
export const OVER_SLOT = 'over-slot'
export const CONFIRMED = 'confirmed'
export const PICKING_UP = 'picking-up'
export const HOMED = 'homed'

// deck layout
export const INSTRUMENT_AXES = ['left', 'right']
export const DECK_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// pipette channels
export const SINGLE_CHANNEL = 'single'
export const MULTI_CHANNEL = 'multi'
