import { SECTIONS } from './constants'
import { useFilterWizardStepsFrom } from '../../resources/wizards/hooks'
import type { Subsystem } from '@opentrons/api-client'
import type { ModuleCalibrationWizardStep } from './types'

export const getModuleCalibrationSteps = (): ModuleCalibrationWizardStep[] => {
  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    { section: SECTIONS.FIRMWARE_UPDATE },
    { section: SECTIONS.SELECT_LOCATION },
    { section: SECTIONS.PLACE_ADAPTER },
    { section: SECTIONS.ATTACH_PROBE },
    { section: SECTIONS.DETACH_PROBE },
    { section: SECTIONS.SUCCESS },
  ]
}

export const useFilteredModuleCalibrationSteps = (
  subsystem: Subsystem
): ModuleCalibrationWizardStep[] =>
  useFilterWizardStepsFrom(getModuleCalibrationSteps(), subsystem)
