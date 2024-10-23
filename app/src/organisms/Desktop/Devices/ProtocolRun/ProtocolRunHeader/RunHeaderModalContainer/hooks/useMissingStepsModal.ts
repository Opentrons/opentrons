import { useSelector } from 'react-redux'
import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { useConditionalConfirm } from '@opentrons/components'

import { useIsHeaterShakerInProtocol } from '/app/organisms/ModuleCard/hooks'
import { isAnyHeaterShakerShaking } from '../modals'
import { getMissingSetupSteps } from '/app/redux/protocol-runs'

import type { UseConditionalConfirmResult } from '@opentrons/components'
import type { RunStatus, AttachedModule } from '@opentrons/api-client'
import type { ConfirmMissingStepsModalProps } from '../modals'
import type { State } from '/app/redux/types'
import type { StepKey } from '/app/redux/protocol-runs'

interface UseMissingStepsModalProps {
  runStatus: RunStatus | null
  attachedModules: AttachedModule[]
  runId: string
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
  runId,
  handleProceedToRunClick,
}: UseMissingStepsModalProps): UseMissingStepsModalResult {
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const isHeaterShakerShaking = isAnyHeaterShakerShaking(attachedModules)
  const missingSetupSteps = useSelector<State, StepKey[]>((state: State) =>
    getMissingSetupSteps(state, runId)
  )
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
