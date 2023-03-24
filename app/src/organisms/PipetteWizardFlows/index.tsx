import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import {
  Flex,
  useConditionalConfirm,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
  RIGHT,
} from '@opentrons/shared-data'
import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  useHost,
  useCreateRunMutation,
  useStopRunMutation,
  useDeleteRunMutation,
} from '@opentrons/react-api-client'

import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { useRunStatus } from '../RunTimeControl/hooks'
import { getIsOnDevice } from '../../redux/config'
import { useAttachedPipettes } from '../Devices/hooks'
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
import { UnskippableModal } from './UnskippableModal'

import type { PipetteMount } from '@opentrons/shared-data'
import type { PipetteWizardFlow, SelectablePipettes } from './types'

interface PipetteWizardFlowsProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  selectedPipette: SelectablePipettes
  closeFlow: () => void
  setSelectedPipette: React.Dispatch<React.SetStateAction<SelectablePipettes>>
}

export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const {
    flowType,
    mount,
    closeFlow,
    selectedPipette,
    setSelectedPipette,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('pipette_wizard_flows')
  const attachedPipettes = useAttachedPipettes()
  const isGantryEmpty =
    attachedPipettes[LEFT] == null && attachedPipettes[RIGHT] == null
  const pipetteWizardSteps = getPipetteWizardSteps(
    flowType,
    mount,
    selectedPipette,
    isGantryEmpty,
    attachedPipettes
  )
  const host = useHost()
  const [runId, setRunId] = React.useState<string>('')
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = pipetteWizardSteps.length - 1
  const currentStep = pipetteWizardSteps?.[currentStepIndex]
  const [isFetchingPipettes, setIsFetchingPipettes] = React.useState<boolean>(
    false
  )

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== pipetteWizardSteps.length - 1 ? 0 : currentStepIndex
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
  const handleClose = (): void => {
    setIsExiting(false)
    closeFlow()
  }

  const runStatus = useRunStatus(runId)
  const { deleteRun } = useDeleteRunMutation({
    onSuccess: () => {
      handleClose()
    },
  })

  React.useEffect(() => {
    if (runId != null && runStatus === RUN_STATUS_STOPPED) deleteRun(runId)
  }, [runStatus, runId, deleteRun])

  // TODO (sb, 3/21/23) temp update to stop homing on exit of a flow, readd home when RSS bug is fixed
  const handleCleanUpAndClose = (): void => {
    setSelectedPipette(SINGLE_MOUNT_PIPETTES)
    setIsExiting(true)
    runId != null ? stopRun(runId) : handleClose()
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
    attachedPipettes,
    setShowErrorMessage,
    errorMessage,
    selectedPipette,
    isOnDevice,
  }
  const exitModal = (
    <ExitModal
      goBack={cancelExit}
      proceed={handleCleanUpAndClose}
      flowType={flowType}
      isOnDevice={isOnDevice}
    />
  )
  const [
    showUnskippableStepModal,
    setIsUnskippableStep,
  ] = React.useState<boolean>(false)
  const unskippableModal = (
    <UnskippableModal
      goBack={() => setIsUnskippableStep(false)}
      isOnDevice={isOnDevice}
    />
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
      if (currentStepIndex < totalStepCount) {
        proceed()
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
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
        isFetching={isFetchingPipettes}
        setFetching={setIsFetchingPipettes}
      />
    )
  } else if (currentStep.section === SECTIONS.MOUNT_PIPETTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <MountPipette
        {...currentStep}
        {...calibrateBaseProps}
        isFetching={isFetchingPipettes}
        setFetching={setIsFetchingPipettes}
      />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PIPETTE) {
    onExit = confirmExit
    modalContent = (
      <DetachPipette
        {...currentStep}
        {...calibrateBaseProps}
        isFetching={isFetchingPipettes}
        setFetching={setIsFetchingPipettes}
      />
    )
    if (showConfirmExit) {
      modalContent = exitModal
    } else if (showUnskippableStepModal) {
      modalContent = unskippableModal
    }
  } else if (currentStep.section === SECTIONS.CARRIAGE) {
    onExit = confirmExit
    modalContent = showUnskippableStepModal ? (
      unskippableModal
    ) : (
      <Carriage {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.MOUNTING_PLATE) {
    onExit = confirmExit
    modalContent = showUnskippableStepModal ? (
      unskippableModal
    ) : (
      <MountingPlate {...currentStep} {...calibrateBaseProps} />
    )
  }
  let wizardTitle: string = 'unknown page'
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = startCase(t('recalibrate_pipette', { mount: mount }))
      } else {
        wizardTitle = t('calibrate_96_channel')
      }
      break
    }
    case FLOWS.ATTACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = startCase(t('attach_pipette', { mount: mount }))
      } else {
        wizardTitle = isGantryEmpty
          ? t('attach_96_channel')
          : t('attach_96_channel_plus_detach', {
              pipetteName:
                attachedPipettes.left?.modelSpecs.displayName ??
                attachedPipettes.right?.modelSpecs.displayName,
            })
      }
      break
    }
    case FLOWS.DETACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        wizardTitle = startCase(t('detach_pipette', { mount: mount }))
      } else {
        wizardTitle = t('detach_96_channel')
      }
      break
    }
  }

  const is96ChannelUnskippableStep =
    currentStep.section === SECTIONS.CARRIAGE ||
    currentStep.section === SECTIONS.MOUNTING_PLATE ||
    (selectedPipette === NINETY_SIX_CHANNEL &&
      currentStep.section === SECTIONS.DETACH_PIPETTE)

  let exitWizardButton = onExit
  if (isRobotMoving || showUnskippableStepModal) {
    exitWizardButton = undefined
  } else if (is96ChannelUnskippableStep) {
    exitWizardButton = () => setIsUnskippableStep(true)
  } else if (showConfirmExit || errorMessage != null) {
    exitWizardButton = handleCleanUpAndClose
  }

  return isOnDevice ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      position={POSITION_ABSOLUTE}
    >
      <WizardHeader
        exitDisabled={isRobotMoving || isFetchingPipettes}
        title={wizardTitle}
        currentStep={currentStepIndex}
        totalSteps={totalStepCount}
        onExit={exitWizardButton}
      />
      {modalContent}
    </Flex>
  ) : (
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
            exitDisabled={isRobotMoving || isFetchingPipettes}
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
