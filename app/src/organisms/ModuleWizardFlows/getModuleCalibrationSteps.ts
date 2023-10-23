import { SECTIONS } from './constants'
import type { ModuleCalibrationWizardStep } from './types'

export const getModuleCalibrationSteps = (
  requiresFirmwareUpdate: boolean
): ModuleCalibrationWizardStep[] => {
  const ALL_STEPS = [
    { section: SECTIONS.BEFORE_BEGINNING },
    { section: SECTIONS.FIRMWARE_UPDATE },
    { section: SECTIONS.SELECT_LOCATION },
    { section: SECTIONS.PLACE_ADAPTER },
    { section: SECTIONS.ATTACH_PROBE },
    { section: SECTIONS.DETACH_PROBE },
    { section: SECTIONS.SUCCESS },
  ]

  return requiresFirmwareUpdate
    ? ALL_STEPS
    : ALL_STEPS.filter(step => step.section !== SECTIONS.FIRMWARE_UPDATE)
}
