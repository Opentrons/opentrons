import {
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'
import type { ModuleModel } from '@opentrons/shared-data'

// Temperature statuses
export const TEMPERATURE_DEACTIVATED: 'TEMPERATURE_DEACTIVATED' =
  'TEMPERATURE_DEACTIVATED'
export const TEMPERATURE_AT_TARGET: 'TEMPERATURE_AT_TARGET' =
  'TEMPERATURE_AT_TARGET'
export const TEMPERATURE_APPROACHING_TARGET: 'TEMPERATURE_APPROACHING_TARGET' =
  'TEMPERATURE_APPROACHING_TARGET'
export const AIR_GAP_OFFSET_FROM_TOP = 1
export const MODULES_WITH_COLLISION_ISSUES: ModuleModel[] = [
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
]
export const FIXED_TRASH_ID: 'fixedTrash' = 'fixedTrash'

export const OT_2_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_1100ml_fixed/1'
export const FLEX_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_3200ml_fixed/1'

export const COLUMN_4_SLOTS = ['A4', 'B4', 'C4', 'D4']
