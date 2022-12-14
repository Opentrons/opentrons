import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import {
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import {
  useHost,
  useCreateRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { ModalShell } from '../../molecules/Modal'
import { getAttachedPipettes } from '../../redux/pipettes'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { FLOWS, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { DetachProbe } from './DetachProbe'
import { Results } from './Results'
import { ExitModal } from './ExitModal'
import { MountPipette } from './MountPipette'
import { DetachPipette } from './DetachPipette'
import { Carriage } from './Carriage'
import { MountingPlate } from './MountingPlate'
import type { PipetteMount } from '@opentrons/shared-data'
import type { State } from '../../redux/types'
import type { PipetteWizardFlow, SelectablePipettes } from './types'

interface PipetteWizardFlowsProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  robotName: string
  selectedPipette: SelectablePipettes
  closeFlow: () => void
}

export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const { flowType, mount, closeFlow, robotName, selectedPipette } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const attachedPipette = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )
  const pipetteWizardSteps = getPipetteWizardSteps(
    flowType,
    mount,
    selectedPipette
  )
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

  const [errorMessage, setShowErrorMessage] = React.useState<null | string>(
    null
  )
  const [isExiting, setIsExiting] = React.useState<boolean>(false)

  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      setCurrentStepIndex(
        currentStepIndex !== pipetteWizardSteps.length - 1
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    chainRunCommands(
      [
        {
          commandType: 'home' as const,
          params: {},
        },
      ],
      false
    ).then(() => {
      if (runId !== '') stopRun(runId)
      setIsExiting(false)
    })
  }
  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const [isRobotMoving, setIsRobotMoving] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (isCommandMutationLoading || isStopLoading || isExiting) {
      setIsRobotMoving(true)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isStopLoading, isExiting])

  const calibrateBaseProps = {
    chainRunCommands,
    isRobotMoving,
    proceed,
    runId,
    goBack,
    attachedPipette,
    setShowErrorMessage,
    errorMessage,
    robotName,
    selectedPipette,
  }
  const exitModal = (
    <ExitModal goBack={cancelExit} proceed={confirmExit} flowType={flowType} />
  )
  let onExit
  if (currentStep == null) return null
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (isExiting) {
    modalContent = <InProgressModal description={t('stand_back')} />
  }
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
    modalContent = showConfirmExit ? (
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
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachProbe
        {...currentStep}
        {...calibrateBaseProps}
        handleCleanUp={handleCleanUpAndClose}
      />
    )
  } else if (currentStep.section === SECTIONS.RESULTS) {
    const handleProceed = (): void => {
      if (
        currentStepIndex === 2 &&
        //  only proceeds if we know that the pipette was successfully attached
        attachedPipette[mount] != null
      ) {
        proceed()
        //  if you completed detaching the pipette, robot will home and delete run
      } else {
        closeFlow()
      }
    }

    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <Results
        {...currentStep}
        {...calibrateBaseProps}
        proceed={handleProceed}
        handleCleanUpAndClose={handleCleanUpAndClose}
      />
    )
  } else if (currentStep.section === SECTIONS.MOUNT_PIPETTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <MountPipette {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PIPETTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachPipette {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.CARRIAGE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <Carriage {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.MOUNTING_PLATE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <MountingPlate {...currentStep} {...calibrateBaseProps} />
    )
  }
  let wizardTitle: string = 'unknown page'
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = t('calibrate_pipette')
      } else {
        wizardTitle = t('calibrate_96_channel')
      }
      break
    }
    case FLOWS.ATTACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = t('attach_pipette')
      } else {
        wizardTitle = t('attach_96_channel')
      }
      break
    }
    case FLOWS.DETACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = t('detach_pipette')
      } else {
        wizardTitle = t('detach_96_channel')
      }
      break
    }
  }

  let exitWizardButton = onExit
  if (isRobotMoving) {
    exitWizardButton = undefined
  } else if (showConfirmExit || errorMessage != null)
    exitWizardButton = handleCleanUpAndClose

  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        height={
          //  changing modal height for now on BeforeBeginning 96 channel attach flow
          //  until we do design qa to normalize the modal sizes
          currentStep.section === SECTIONS.BEFORE_BEGINNING &&
          selectedPipette === NINETY_SIX_CHANNEL &&
          flowType === FLOWS.ATTACH
            ? '70%'
            : 'auto'
        }
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
