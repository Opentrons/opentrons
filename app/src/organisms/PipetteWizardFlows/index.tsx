import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  LoadedPipette,
} from '@opentrons/shared-data'
import {
  useHost,
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainMaintenanceCommands } from '../../resources/runs/hooks'
import { getIsOnDevice } from '../../redux/config'
import { useAttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'
import { usePipetteFlowWizardHeaderText } from './hooks'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { getPipetteWizardStepsForProtocol } from './getPipetteWizardStepsForProtocol'
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
  onComplete?: () => void
  pipetteInfo?: LoadedPipette[]
}

export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const { flowType, mount, closeFlow, selectedPipette, onComplete } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('pipette_wizard_flows')

  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const isGantryEmpty =
    attachedPipettes[LEFT] == null && attachedPipettes[RIGHT] == null
  const pipetteWizardSteps = React.useMemo(
    () =>
      props.pipetteInfo == null
        ? getPipetteWizardSteps(
            flowType,
            mount,
            selectedPipette,
            isGantryEmpty,
            attachedPipettes
          )
        : getPipetteWizardStepsForProtocol(
            attachedPipettes,
            props.pipetteInfo,
            mount
          ),
    []
  )
  const requiredPipette = props.pipetteInfo?.find(
    pipette => pipette.mount === mount
  )
  const host = useHost()
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string>('')
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = pipetteWizardSteps.length - 1
  const currentStep = pipetteWizardSteps?.[currentStepIndex]
  const [isFetchingPipettes, setIsFetchingPipettes] = React.useState<boolean>(
    false
  )
  const hasCalData =
    attachedPipettes[mount]?.data.calibratedOffset?.last_modified != null

  const wizardTitle = usePipetteFlowWizardHeaderText({
    flowType,
    mount,
    selectedPipette,
    hasCalData,
    isGantryEmpty,
    attachedPipettes,
    pipetteInfo: props.pipetteInfo ?? null,
  })

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== totalStepCount ? 0 : currentStepIndex
    )
  }
  const {
    chainRunCommands,
    isCommandMutationLoading,
  } = useChainMaintenanceCommands(maintenanceRunId)

  const {
    createMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateMaintenanceRunMutation(
    {
      onSuccess: response => {
        setMaintenanceRunId(response.data.id)
      },
    },
    host
  )

  const [errorMessage, setShowErrorMessage] = React.useState<null | string>(
    null
  )
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      setCurrentStepIndex(
        currentStepIndex !== totalStepCount
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  const handleClose = (): void => {
    setIsExiting(false)
    closeFlow()
    if (currentStepIndex === totalStepCount && onComplete != null) onComplete()
  }

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => handleClose(),
    onError: () => handleClose(),
  })

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunId == null) handleClose()
    else {
      chainRunCommands([{ commandType: 'home' as const, params: {} }], false)
        .then(() => {
          deleteMaintenanceRun(maintenanceRunId)
        })
        .catch(error => {
          console.error(error)
          handleClose()
        })
    }
  }
  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const [isRobotMoving, setIsRobotMoving] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (isCommandMutationLoading || isExiting) {
      setIsRobotMoving(true)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isExiting])

  const calibrateBaseProps = {
    chainRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId,
    goBack,
    attachedPipettes,
    setShowErrorMessage,
    errorMessage,
    selectedPipette,
    isOnDevice,
  }
  const exitModal = (
    <ExitModal
      isRobotMoving={isRobotMoving}
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
        createMaintenanceRun={createMaintenanceRun}
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
        proceed={errorMessage != null ? handleCleanUpAndClose : proceed}
      />
    )
  } else if (currentStep.section === SECTIONS.RESULTS) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <Results
        {...currentStep}
        {...calibrateBaseProps}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
        isFetching={isFetchingPipettes}
        setFetching={setIsFetchingPipettes}
        hasCalData={hasCalData}
        requiredPipette={requiredPipette}
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
  const is96ChannelUnskippableStep =
    currentStep.section === SECTIONS.CARRIAGE ||
    currentStep.section === SECTIONS.MOUNTING_PLATE ||
    (selectedPipette === NINETY_SIX_CHANNEL &&
      currentStep.section === SECTIONS.DETACH_PIPETTE)

  const isCalibrationErrorExiting =
    currentStep.section === SECTIONS.ATTACH_PROBE && errorMessage != null

  let exitWizardButton = onExit
  if (isRobotMoving || showUnskippableStepModal || isCalibrationErrorExiting) {
    exitWizardButton = undefined
  } else if (is96ChannelUnskippableStep) {
    exitWizardButton = () => setIsUnskippableStep(true)
  } else if (showConfirmExit || errorMessage != null) {
    exitWizardButton = handleCleanUpAndClose
  }

  const progressBarForCalError =
    currentStep.section === SECTIONS.DETACH_PROBE && errorMessage != null

  const wizardHeader = (
    <WizardHeader
      exitDisabled={isRobotMoving || isFetchingPipettes}
      title={wizardTitle}
      currentStep={
        progressBarForCalError ? currentStepIndex - 1 : currentStepIndex
      }
      totalSteps={totalStepCount}
      onExit={exitWizardButton}
    />
  )

  return (
    <Portal level="top">
      {isOnDevice ? (
        <ModalShell>
          {wizardHeader}
          {modalContent}
        </ModalShell>
      ) : (
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
          header={wizardHeader}
        >
          {modalContent}
        </ModalShell>
      )}
    </Portal>
  )
}
