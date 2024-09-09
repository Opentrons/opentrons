import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { useConditionalConfirm } from '@opentrons/components'

import { useIsHeaterShakerInProtocol } from '../../../../../ModuleCard/hooks'
import { isAnyHeaterShakerShaking } from '../modals'

import type { UseConditionalConfirmResult } from '@opentrons/components'
import type { RunStatus, AttachedModule } from '@opentrons/api-client'
import type { ConfirmMissingStepsModalProps } from '../../../ConfirmMissingStepsModal'

interface UseMissingStepsModalProps {
  runStatus: RunStatus | null
  attachedModules: AttachedModule[]
  missingSetupSteps: string[]
  handleProceedToRunClick: () => void
}

export type UseMissingStepsModalResult =
  | {
      showModal: true
      modalProps: ConfirmMissingStepsModalProps
      conditionalConfirmUtils: UseConditionalConfirmResult<[]>
    }
  | {
      showModal: false
      modalProps: null
      conditionalConfirmUtils: UseConditionalConfirmResult<[]>
    }

export function useMissingStepsModal({
  attachedModules,
  runStatus,
  missingSetupSteps,
  handleProceedToRunClick,
}: UseMissingStepsModalProps): UseMissingStepsModalResult {
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const isHeaterShakerShaking = isAnyHeaterShakerShaking(attachedModules)

  const shouldShowHSConfirm =
    isHeaterShakerInProtocol &&
    !isHeaterShakerShaking &&
    (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)

  const conditionalConfirmUtils = useConditionalConfirm(
    handleProceedToRunClick,
    missingSetupSteps.length !== 0
  )

  const modalProps: ConfirmMissingStepsModalProps = {
    onCloseClick: conditionalConfirmUtils.cancel,
    onConfirmClick: () => {
      shouldShowHSConfirm
        ? conditionalConfirmUtils.confirm()
        : handleProceedToRunClick()
    },
    missingSteps: missingSetupSteps,
  }

  return conditionalConfirmUtils.showConfirmation
    ? {
        showModal: true,
        modalProps,
        conditionalConfirmUtils,
      }
    : { showModal: false, modalProps: null, conditionalConfirmUtils }
}
