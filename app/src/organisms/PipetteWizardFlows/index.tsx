import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getAttachedPipettes } from '../../redux/pipettes'
import { useConditionalConfirm } from '@opentrons/components'
import {
  useHost,
  useCreateRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { FLOWS, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { DetachProbe } from './DetachProbe'
import { Results } from './Results'
import { ExitModal } from './ExitModal'

import type { PipetteMount } from '@opentrons/shared-data'
import type { State } from '../../redux/types'
import type { PipetteWizardFlow } from './types'

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
  const { stopRun, isLoading: isStopLoading } = useStopRunMutation({
    onSuccess: () => {
      if (currentStep.section === SECTIONS.DETACH_PROBE) {
        proceed()
      } else {
        closeFlow()
      }
    },
  })

  const [isBetweenCommands, setIsBetweenCommands] = React.useState<boolean>(
    false
  )
  const [isExiting, setIsExiting] = React.useState<boolean>(false)

  const proceed = (): void => {
    if (
      !(
        isCommandMutationLoading ||
        isStopLoading ||
        isBetweenCommands ||
        isExiting
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
    setIsExiting(true)
    chainRunCommands([
      {
        commandType: 'home' as const,
        params: {},
      },
    ]).then(() => {
      setIsExiting(false)
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
      isBetweenCommands ||
      isExiting
    ) {
      const timer = setTimeout(() => setIsRobotMoving(true), 700)
      return () => clearTimeout(timer)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isStopLoading, isBetweenCommands, isExiting])

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
    <ExitModal goBack={cancelExit} proceed={confirmExit} flowType={flowType} />
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
  } else if (currentStep.section === SECTIONS.ATTACH_PROBE) {
    onExit = confirmExit
    modalContent = modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <AttachProbe
        {...currentStep}
        {...calibrateBaseProps}
        isExiting={isExiting}
      />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PROBE) {
    onExit = confirmExit
    modalContent = modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachProbe
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
