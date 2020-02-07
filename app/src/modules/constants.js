// @flow
import { THERMOCYCLER } from '@opentrons/shared-data'

// common constants

export const PREPARABLE_MODULES = [THERMOCYCLER]

export { MAGDECK, TEMPDECK, THERMOCYCLER } from '@opentrons/shared-data'

// http paths

export const MODULES_PATH: '/modules' = '/modules'
export const MODULE_UPDATE_PATH_EXT: 'update' = 'update'

// fetch modules

export const FETCH_MODULES: 'modules:FETCH_MODULES' = 'modules:FETCH_MODULES'

export const FETCH_MODULES_SUCCESS: 'modules:FETCH_MODULES_SUCCESS' =
  'modules:FETCH_MODULES_SUCCESS'

export const FETCH_MODULES_FAILURE: 'modules:FETCH_MODULES_FAILURE' =
  'modules:FETCH_MODULES_FAILURE'

// send module command

export const SEND_MODULE_COMMAND: 'modules:SEND_MODULE_COMMAND' =
  'modules:SEND_MODULE_COMMAND'

export const SEND_MODULE_COMMAND_SUCCESS: 'modules:SEND_MODULE_COMMAND_SUCCESS' =
  'modules:SEND_MODULE_COMMAND_SUCCESS'

export const SEND_MODULE_COMMAND_FAILURE: 'modules:SEND_MODULE_COMMAND_FAILURE' =
  'modules:SEND_MODULE_COMMAND_FAILURE'

// update module

export const UPDATE_MODULE: 'modules:UPDATE_MODULE' = 'modules:UPDATE_MODULE'

export const UPDATE_MODULE_SUCCESS: 'modules:UPDATE_MODULE_SUCCESS' =
  'modules:UPDATE_MODULE_SUCCESS'

export const UPDATE_MODULE_FAILURE: 'modules:UPDATE_MODULE_FAILURE' =
  'modules:UPDATE_MODULE_FAILURE'
