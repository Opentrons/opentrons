import { SECTIONS } from './constants'
import type { ModuleCalibrationWizardStep } from './types'

export const getModuleCalibrationSteps = (): ModuleCalibrationWizardStep[] => {
  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    { section: SECTIONS.FIRMWARE_UPDATE },
    { section: SECTIONS.SELECT_LOCATION },
    { section: SECTIONS.PLACE_ADAPTER },
    { section: SECTIONS.ATTACH_PROBE },
    { section: SECTIONS.SUCCESS },
  ]
}
