import { ModuleType, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

// common constants

export const PREPARABLE_MODULE_TYPES: ModuleType[] = [THERMOCYCLER_MODULE_TYPE]

export {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'

// http paths

export const MODULES_PATH: '/modules' = '/modules'
export const MODULE_UPDATE_PATH_EXT: 'update' = 'update'

// update module

export const UPDATE_MODULE: 'modules:UPDATE_MODULE' = 'modules:UPDATE_MODULE'

export const UPDATE_MODULE_SUCCESS: 'modules:UPDATE_MODULE_SUCCESS' =
  'modules:UPDATE_MODULE_SUCCESS'

export const UPDATE_MODULE_FAILURE: 'modules:UPDATE_MODULE_FAILURE' =
  'modules:UPDATE_MODULE_FAILURE'
