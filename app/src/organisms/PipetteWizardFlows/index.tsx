import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  LoadedPipette,
  CreateCommand,
} from '@opentrons/shared-data'
import {
  useHost,
  useDeleteMaintenanceRunMutation,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import {
  useCreateTargetedMaintenanceRunMutation,
  useChainMaintenanceCommands,
} from '../../resources/runs/hooks'

import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { FirmwareUpdateModal } from '../FirmwareUpdateModal'
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
import type { CommandData } from '@opentrons/api-client'
import type { PipetteWizardFlow, SelectablePipettes } from './types'

const RUN_REFETCH_INTERVAL = 5000

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
  const memoizedPipetteInfo = React.useMemo(() => props.pipetteInfo ?? null, [])
  const isGantryEmpty = React.useMemo(
    () => attachedPipettes[LEFT] == null && attachedPipettes[RIGHT] == null,
    []
  )

  const pipetteWizardSteps = React.useMemo(
    () =>
      memoizedPipetteInfo == null
        ? getPipetteWizardSteps(flowType, mount, selectedPipette, isGantryEmpty)
        : getPipetteWizardStepsForProtocol(
            attachedPipettes,
            memoizedPipetteInfo,
            mount
          ),
    []
  )
  const requiredPipette = memoizedPipetteInfo?.find(
    pipette => pipette.mount === mount
  )
  const host = useHost()
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = pipetteWizardSteps.length - 1
  const currentStep = pipetteWizardSteps?.[currentStepIndex]
  const [isFetchingPipettes, setIsFetchingPipettes] = React.useState<boolean>(
    false
  )
  const memoizedAttachedPipettes = React.useMemo(() => attachedPipettes, [])
  const hasCalData =
    memoizedAttachedPipettes[mount]?.data.calibratedOffset?.last_modified !=
    null
  const wizardTitle = usePipetteFlowWizardHeaderText({
    flowType,
    mount,
    selectedPipette,
    hasCalData,
    isGantryEmpty,
    attachedPipettes: memoizedAttachedPipettes,
    pipetteInfo: memoizedPipetteInfo,
  })
  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)
  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = React.useState<boolean>(false)

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== totalStepCount ? 0 : currentStepIndex
    )
  }
  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: createdMaintenanceRunId != null,
  })

  const {
    chainRunCommands,
    isCommandMutationLoading,
  } = useChainMaintenanceCommands()

  const {
    createTargetedMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateTargetedMaintenanceRunMutation(
    {
      onSuccess: response => {
        setCreatedMaintenanceRunId(response.data.id)
      },
    },
    host
  )

  // this will close the modal in case the run was deleted by the terminate
  // activity modal on the ODD
  React.useEffect(() => {
    if (
      createdMaintenanceRunId !== null &&
      maintenanceRunData?.data.id === createdMaintenanceRunId
    ) {
      setMonitorMaintenanceRunForDeletion(true)
    }
    if (
      maintenanceRunData?.data.id !== createdMaintenanceRunId &&
      monitorMaintenanceRunForDeletion
    ) {
      closeFlow()
    }
  }, [
    maintenanceRunData?.data.id,
    createdMaintenanceRunId,
    monitorMaintenanceRunForDeletion,
    closeFlow,
  ])

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
    if (onComplete != null) onComplete()
  }

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => handleClose(),
    onError: () => handleClose(),
  })

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) handleClose()
    else {
      chainRunCommands(
        maintenanceRunData?.data.id,
        [{ commandType: 'home' as const, params: {} }],
        false
      )
        .then(() => {
          deleteMaintenanceRun(maintenanceRunData?.data.id)
        })
        .catch(error => {
          console.error(error.message)
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

  let chainMaintenanceRunCommands
  if (maintenanceRunData?.data.id != null) {
    chainMaintenanceRunCommands = (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ): Promise<CommandData[]> =>
      chainRunCommands(
        maintenanceRunData.data.id,
        commands,
        continuePastCommandFailure
      )
  }

  const maintenanceRunId =
    maintenanceRunData?.data.id != null &&
    maintenanceRunData?.data.id === createdMaintenanceRunId
      ? createdMaintenanceRunId
      : undefined
  const calibrateBaseProps = {
    chainRunCommands: chainMaintenanceRunCommands,
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
  const is96ChannelUnskippableStep =
    currentStep.section === SECTIONS.CARRIAGE ||
    currentStep.section === SECTIONS.MOUNTING_PLATE ||
    (selectedPipette === NINETY_SIX_CHANNEL &&
      currentStep.section === SECTIONS.DETACH_PIPETTE)

  const exitModal = is96ChannelUnskippableStep ? (
    <UnskippableModal
      proceed={handleCleanUpAndClose}
      goBack={cancelExit}
      isOnDevice={isOnDevice}
      isRobotMoving={isRobotMoving}
    />
  ) : (
    <ExitModal
      isRobotMoving={isRobotMoving}
      goBack={cancelExit}
      proceed={handleCleanUpAndClose}
      flowType={flowType}
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
        createMaintenanceRun={createTargetedMaintenanceRun}
        createdMaintenanceRunId={createdMaintenanceRunId}
        isCreateLoading={isCreateLoading}
        requiredPipette={requiredPipette}
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
  } else if (currentStep.section === SECTIONS.FIRMWARE_UPDATE) {
    modalContent = (
      <FirmwareUpdateModal
        proceed={proceed}
        subsystem={mount === LEFT ? 'pipette_left' : 'pipette_right'}
        description={t('firmware_updating')}
        proceedDescription={t('firmware_up_to_date')}
        isOnDevice={isOnDevice}
      />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PIPETTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachPipette
        {...currentStep}
        {...calibrateBaseProps}
        isFetching={isFetchingPipettes}
        setFetching={setIsFetchingPipettes}
      />
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

  let exitWizardButton = onExit
  if (isRobotMoving) {
    exitWizardButton = undefined
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
        <LegacyModalShell>
          {wizardHeader}
          {modalContent}
        </LegacyModalShell>
      ) : (
        <LegacyModalShell
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
        </LegacyModalShell>
      )}
    </Portal>
  )
}
