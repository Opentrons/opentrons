import { useInstrumentsQuery } from '@opentrons/react-api-client'

import type { BadGripper, BadPipette, Subsystem } from '@opentrons/api-client'
import type { ModuleCalibrationWizardStep } from '../../organisms/ModuleWizardFlows/types'
import type { PipetteWizardStep } from '../../organisms/PipetteWizardFlows/types'
import type { GripperWizardStep } from '../../organisms/GripperWizardFlows/types'

// TODO(jh, 2023-09-22): unify all wizard step typing
type WizardStep =
  | ModuleCalibrationWizardStep
  | PipetteWizardStep
  | GripperWizardStep

export function useFilterWizardStepsFrom(
  wizardSteps: WizardStep[],
  subsystem: Subsystem
): WizardStep[] {
  const filterFirmwareUpdate = (): WizardStep[] => {
    const updateNeeded =
      attachedInstruments?.data?.some(
        (i): i is BadGripper | BadPipette => !i.ok && i.subsystem === subsystem
      ) ?? false
    return !updateNeeded
      ? wizardSteps.filter(step => step.section !== 'FIRMWARE_UPDATE')
      : wizardSteps
  }

  const { data: attachedInstruments } = useInstrumentsQuery()
  return filterFirmwareUpdate()
}
