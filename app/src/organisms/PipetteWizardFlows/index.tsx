import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getAttachedPipettes } from '../../redux/pipettes'
import { useConditionalConfirm } from '@opentrons/components'
import {
  useHost,
  useCreateRunMutation,
  useDeleteRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { useCloseCurrentRun } from '../ProtocolUpload/hooks'
import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { FLOWS, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachStem } from './AttachStem'
import { DetachStem } from './DetachStem'
import { Results } from './Results'
import { ExitModal } from './ExitModal'

import type { PipetteWizardFlow } from './types'
import type { State } from '../../redux/types'
import type { PipetteMount } from '@opentrons/shared-data'

interface PipetteWizardFlowsProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  robotName: string
  closeFlow: () => void
}

export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const { flowType, mount, closeFlow, robotName } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const attachedPipette = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )
  const pipetteWizardSteps = getPipetteWizardSteps(flowType, mount)
  const host = useHost()
  const [runId, setRunId] = React.useState<string>('')
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)

  const totalStepCount = pipetteWizardSteps.length - 1
  const currentStep = pipetteWizardSteps?.[currentStepIndex]
  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== pipetteWizardSteps.length - 1
        ? currentStepIndex - 1
        : currentStepIndex
    )
  }
  const { chainRunCommands, isCommandMutationLoading } = useChainRunCommands(
    runId
  )

  const { createRun, isLoading: isCreateLoading } = useCreateRunMutation(
    {
      onSuccess: response => {
        setRunId(response.data.id)
      },
    },
    host
  )
  const { deleteRun, isLoading: isDeleteLoading } = useDeleteRunMutation({
    onSuccess: () => {
      if (currentStep.section === SECTIONS.DETACH_STEM) {
        proceed()
      } else {
        closeFlow()
      }
    },
  })
  const { stopRun, isLoading: isStopLoading } = useStopRunMutation({
    onSuccess: () => {
      closeCurrentRun()
      if (!isClosingCurrentRun) deleteRun(runId)
    },
  })
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const [isBetweenCommands, setIsBetweenCommands] = React.useState<boolean>(
    false
  )

  const proceed = (): void => {
    if (
      !(
        isCommandMutationLoading ||
        isStopLoading ||
        isDeleteLoading ||
        isBetweenCommands
      )
    ) {
      setCurrentStepIndex(
        currentStepIndex !== pipetteWizardSteps.length - 1
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  const handleCleanUpAndClose = (): void => {
    setIsBetweenCommands(true)
    chainRunCommands([
      {
        commandType: 'home' as const,
        params: {},
      },
    ]).then(() => {
      setIsBetweenCommands(false)
      if (runId !== '') stopRun(runId)
    })
  }
  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const [isRobotMoving, setIsRobotMoving] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (
      isCommandMutationLoading ||
      isStopLoading ||
      isDeleteLoading ||
      isBetweenCommands
    ) {
      const timer = setTimeout(() => setIsRobotMoving(true), 700)
      return () => clearTimeout(timer)
    } else {
      setIsRobotMoving(false)
    }
  }, [
    isCommandMutationLoading,
    isStopLoading,
    isDeleteLoading,
    isBetweenCommands,
  ])

  const calibrateBaseProps = {
    chainRunCommands,
    isRobotMoving,
    proceed,
    runId,
    goBack,
    attachedPipette,
    setIsBetweenCommands,
    isBetweenCommands,
  }
  const exitModal = (
    <ExitModal
      {...calibrateBaseProps}
      goBack={cancelExit}
      proceed={closeFlow}
      flowType={flowType}
      mount={mount}
    />
  )
  let onExit
  if (currentStep == null) return null
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>

  if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    onExit = handleCleanUpAndClose
    modalContent = (
      <BeforeBeginning
        {...currentStep}
        {...calibrateBaseProps}
        createRun={createRun}
        isCreateLoading={isCreateLoading}
      />
    )
  } else if (currentStep.section === SECTIONS.ATTACH_STEM) {
    onExit = confirmExit
    modalContent = modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <AttachStem {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.DETACH_STEM) {
    onExit = confirmExit
    modalContent = modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachStem
        {...currentStep}
        {...calibrateBaseProps}
        handleCleanUp={handleCleanUpAndClose}
      />
    )
  } else if (currentStep.section === SECTIONS.RESULTS) {
    onExit = confirmExit
    modalContent = modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <Results {...currentStep} {...calibrateBaseProps} proceed={closeFlow} />
    )
  }

  let wizardTitle: string = 'unknown page'
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      wizardTitle = t('calibrate_pipette')
      break
    }
  }
  let exitWizardButton = onExit
  if (isRobotMoving) {
    exitWizardButton = undefined
  } else if (showConfirmExit) exitWizardButton = handleCleanUpAndClose

  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={wizardTitle}
            currentStep={currentStepIndex}
            totalSteps={totalStepCount}
            onExit={exitWizardButton}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}
