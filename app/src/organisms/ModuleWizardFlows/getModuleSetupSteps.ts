import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SECTIONS } from './constants'

import type { ModuleType } from '@opentrons/shared-data'
import type { ModuleSetupWizardStep } from './types'

export const getModuleSetupSteps = (
  moduleType: ModuleType
): ModuleSetupWizardStep[] => {
  switch (moduleType) {
    case ABSORBANCE_READER_TYPE:
      return [
        { section: SECTIONS.UPDATE_FIRMWARE },
        { section: SECTIONS.SELECT_LOCATION },
        { section: SECTIONS.SUCCESS },
      ]
    case FLEX_STACKER_MODULE_TYPE:
      return [
        { section: SECTIONS.CHECK_INSTALLATION_PINS },
        { section: SECTIONS.UPDATE_FIRMWARE },
        { section: SECTIONS.SELECT_LOCATION },
        { section: SECTIONS.CLOSE_DOOR },
        { section: SECTIONS.INSTALL_SHUTTLE },
        { section: SECTIONS.SUCCESS },
      ]
    case VACUUM_MODULE_TYPE:
      return [
        { section: SECTIONS.UPDATE_FIRMWARE },
        { section: SECTIONS.SELECT_LOCATION },
        { section: SECTIONS.VERIFY_VACUUM },
        { section: SECTIONS.SUCCESS },
      ]
    default:
      return [
        { section: SECTIONS.UPDATE_FIRMWARE },
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.SELECT_LOCATION },
        { section: SECTIONS.PLACE_ADAPTER },
        { section: SECTIONS.ATTACH_PROBE },
        { section: SECTIONS.DETACH_PROBE },
        { section: SECTIONS.SUCCESS },
      ]
  }
}
