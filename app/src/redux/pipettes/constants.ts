import type { Mount } from './types'

// action types

// fetch pipettes

export const FETCH_PIPETTES: 'pipettes:FETCH_PIPETTES' =
  'pipettes:FETCH_PIPETTES'

export const FETCH_PIPETTES_SUCCESS: 'pipettes:FETCH_PIPETTES_SUCCESS' =
  'pipettes:FETCH_PIPETTES_SUCCESS'

export const FETCH_PIPETTES_FAILURE: 'pipettes:FETCH_PIPETTES_FAILURE' =
  'pipettes:FETCH_PIPETTES_FAILURE'

// fetch pipette settings

export const FETCH_PIPETTE_SETTINGS: 'pipettes:FETCH_PIPETTE_SETTINGS' =
  'pipettes:FETCH_PIPETTE_SETTINGS'

export const FETCH_PIPETTE_SETTINGS_SUCCESS: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS' =
  'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS'

export const FETCH_PIPETTE_SETTINGS_FAILURE: 'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE' =
  'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE'

// update pipette settings

export const UPDATE_PIPETTE_SETTINGS: 'pipettes:UPDATE_PIPETTE_SETTINGS' =
  'pipettes:UPDATE_PIPETTE_SETTINGS'

export const UPDATE_PIPETTE_SETTINGS_SUCCESS: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS' =
  'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS'

export const UPDATE_PIPETTE_SETTINGS_FAILURE: 'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE' =
  'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE'

// HTTP API paths

export const PIPETTES_PATH: '/pipettes' = '/pipettes'
export const PIPETTE_SETTINGS_PATH: '/settings/pipettes' = '/settings/pipettes'

// pipette compatibility

export const LEFT: 'left' = 'left'
export const RIGHT: 'right' = 'right'
export const PIPETTE_MOUNTS: Mount[] = [LEFT, RIGHT]
export const MATCH: 'match' = 'match'
export const INCOMPATIBLE: 'incompatible' = 'incompatible'
export const INEXACT_MATCH: 'inexact_match' = 'inexact_match'
