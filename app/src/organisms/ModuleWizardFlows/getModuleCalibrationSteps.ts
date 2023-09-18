import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { SECTIONS } from './constants'
import type { ModuleType } from '@opentrons/shared-data'
import type { ModuleCalibrationWizardStep } from './types'

export const getModuleCalibrationSteps = (
  moduleType: ModuleType
): ModuleCalibrationWizardStep[] => {
  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    { section: SECTIONS.FIRMWARE_UPDATE },
    { section: SECTIONS.SELECT_LOCATION },
    { section: SECTIONS.PLACE_ADAPTER },
    { section: SECTIONS.ATTACH_PROBE },
    { section: SECTIONS.DETACH_PROBE },
    { section: SECTIONS.SUCCESS },
  ].filter(step =>
    moduleType === THERMOCYCLER_MODULE_TYPE
      ? step.section !== SECTIONS.SELECT_LOCATION
      : step
  )
}
