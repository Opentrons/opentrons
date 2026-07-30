import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { RUN_STATUS_FAILED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  ModalShell,
  PrimaryButton,
  SPACING,
  useConditionalConfirm,
  WizardHeader,
} from '@opentrons/components'
import {
  isDocumentedMutationError,
  useDeleteMaintenanceRunMutation,
  useHost,
} from '@opentrons/react-api-client'
import { LEFT, NINETY_SIX_CHANNEL, RIGHT } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { useMaintenanceRunDocumentation } from '/app/local-resources/access-control/useMaintenanceRunDocumentation'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'
import { getIsOnDevice } from '/app/redux/config'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import {
  useChainMaintenanceCommands,
  useNotifyCurrentMaintenanceRun,
} from '/app/resources/maintenance_runs'
import { useCreateTargetedMaintenanceRunMutation } from '/app/resources/runs'

import { FirmwareUpdateModal } from '../FirmwareUpdateModal'
import { AttachProbe } from './AttachProbe'
import { AttachWasteChute } from './AttachWasteChute'
import { BeforeBeginning } from './BeforeBeginning'
import { Carriage } from './Carriage'
import { FLOWS, SECTIONS } from './constants'
import { DetachPipette } from './DetachPipette'
import { DetachProbe } from './DetachProbe'
import { ExitModal } from './ExitModal'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { getPipetteWizardStepsForProtocol } from './getPipetteWizardStepsForProtocol'
import { usePipetteFlowWizardHeaderText } from './hooks'
import { MountingPlate } from './MountingPlate'
import { MountPipette } from './MountPipette'
import { RemoveWasteChute } from './RemoveWasteChute'
import { Results } from './Results'
import { UnskippableModal } from './UnskippableModal'

import type { CommandData } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type {
  CreateCommand,
  LoadedPipette,
  PipetteMount,
} from '@opentrons/shared-data'
import type { PipetteWizardFlow, SelectablePipettes } from './types'

const RUN_REFETCH_INTERVAL = 5000

interface PipetteWizardFlowsProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  selectedPipette: SelectablePipettes
  closeFlow: () => void
  onComplete?: () => void
  pipetteInfo?: LoadedPipette[]
  initialDocstate?: DocumentationState
}

export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const {
    flowType,
    mount,
    closeFlow,
    selectedPipette,
    onComplete,
    initialDocstate,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('pipette_wizard_flows')
  const deckConfig = useNotifyDeckConfigurationQuery()
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedPipetteInfo = useMemo(() => props.pipetteInfo ?? null, [])
  const isGantryEmpty = useMemo(
    () => attachedPipettes[LEFT] == null && attachedPipettes[RIGHT] == null,
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const pipetteWizardSteps = useMemo(
    () =>
      memoizedPipetteInfo == null
        ? getPipetteWizardSteps(
            flowType,
            mount,
            selectedPipette,
            isGantryEmpty,
            attachedPipettes,
            deckConfig
          )
        : getPipetteWizardStepsForProtocol(
            attachedPipettes,
            memoizedPipetteInfo,
            mount,
            deckConfig
          ),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const requiredPipette = memoizedPipetteInfo?.find(
    pipette => pipette.mount === mount
  )
  const host = useHost()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const totalStepCount =
    pipetteWizardSteps != null ? pipetteWizardSteps.length - 1 : 0
  const currentStep = pipetteWizardSteps?.[currentStepIndex] ?? null
  const [isFetchingPipettes, setIsFetchingPipettes] = useState<boolean>(false)
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedAttachedPipettes = useMemo(() => attachedPipettes, [])
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
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedWizardTitle = useMemo(() => wizardTitle, [])
  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = useState<
    string | null
  >(null)
  const [errorMessage, setShowErrorMessage] = useState<null | string>(null)
  const [isDoorOpenError, setIsDoorOpenError] = useState<boolean>(false)
  const dismissDoorOpenError = (): void => {
    setShowErrorMessage(null)
    setIsDoorOpenError(false)
  }
  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = useState<boolean>(false)
  const isDetachPipettesAndAttach96ChFlow =
    flowType === FLOWS.ATTACH &&
    !isGantryEmpty &&
    selectedPipette === NINETY_SIX_CHANNEL

  const goBack = (): void => {
    if (currentStepIndex !== totalStepCount) {
      // The detach pipettes + attach 96ch flow is a compound flow that effectively
      // has two "checkpoints". As a user passes a checkpoint, pressing "go back"
      // should return to the most recent checkpoint.
      if (isDetachPipettesAndAttach96ChFlow) {
        if (currentStepIndex <= 2) {
          setCurrentStepIndex(0)
        } else {
          const stepIdx =
            pipetteWizardSteps?.findIndex(
              step => step.section === SECTIONS.CARRIAGE
            ) ?? 3 // Safe fallback that at least allows users to proceed.

          setCurrentStepIndex(stepIdx)
        }
      } else {
        setCurrentStepIndex(0)
      }
    }
  }

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: createdMaintenanceRunId != null,
  })

  const maintenanceRunAction: DocumentedAction = useMemo(() => {
    return {
      type: 'pipette_wizard_flow',
      mount,
      flowType,
      pipette: selectedPipette,
      pipetteInfo: attachedPipettes[mount] ?? null,
      step: 'start',
    }
  }, [mount, flowType, selectedPipette, attachedPipettes])

  const deleteRunAction: DocumentedAction = useMemo(() => {
    return {
      type: 'pipette_wizard_flow',
      mount,
      flowType,
      pipette: selectedPipette,
      pipetteInfo: attachedPipettes[mount] ?? null,
      step: 'end',
    }
  }, [mount, flowType, selectedPipette, attachedPipettes])

  const {
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
  } = useMaintenanceRunDocumentation(
    maintenanceRunAction,
    closeFlow,
    initialDocstate
  )

  const { chainRunCommands, isCommandMutationLoading } =
    useChainMaintenanceCommands(
      commandDocState,
      actionsToDocument,
      addActionToDocument
    )

  const { createTargetedMaintenanceRun, isLoading: isCreateLoading } =
    useCreateTargetedMaintenanceRunMutation(
      commandDocState,
      actionsToDocument,
      {
        onSuccess: response => {
          setCreatedMaintenanceRunId(response.data.id)
        },
        onError: (error: unknown) => {
          if (isDocumentedMutationError(error)) {
            return
          }
          setShowErrorMessage(
            error instanceof Error ? error.message : String(error)
          )
        },
      },
      host
    )

  // this will close the modal in case the run was deleted by the terminate
  // activity modal on the ODD
  useEffect(() => {
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

  const [isExiting, setIsExiting] = useState<boolean>(false)
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
    if (maintenanceRunData != null) {
      deleteMaintenanceRun(maintenanceRunData?.data.id)
    } else {
      onComplete?.()
      closeFlow()
    }
  }

  const { deleteMaintenanceRun, isLoading: isDeleteLoading } =
    useDeleteMaintenanceRunMutation(
      deletionDocState,
      [...actionsToDocument, deleteRunAction],
      {
        onSuccess: () => {
          onComplete?.()
          closeFlow()
        },
        onError: () => {
          setIsExiting(false)
        },
      }
    )

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) handleClose()
    else {
      chainRunCommands(
        maintenanceRunData?.data.id,
        [{ commandType: 'home' as const, params: {} }],
        false
      )
        .catch(error => {
          if (isMaintenanceDoorOpenError(error)) {
            setIsDoorOpenError(true)
            setShowErrorMessage(t('door_is_open') as string)
          } else {
            setIsExiting(true)
            setShowErrorMessage(error.message as string)
          }
        })
        .finally(() => {
          handleClose()
        })
    }
  }
  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

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
    isRobotMoving: isCommandMutationLoading || isDeleteLoading,
    proceed,
    maintenanceRunId,
    goBack,
    attachedPipettes,
    setShowErrorMessage,
    errorMessage,
    isDoorOpenError,
    setIsDoorOpenError,
    dismissDoorOpenError,
    selectedPipette,
    isOnDevice,
  }
  const is96ChannelUnskippableStep =
    currentStep?.section === SECTIONS.CARRIAGE ||
    currentStep?.section === SECTIONS.MOUNTING_PLATE ||
    (selectedPipette === NINETY_SIX_CHANNEL &&
      currentStep?.section === SECTIONS.DETACH_PIPETTE)

  const exitModal = is96ChannelUnskippableStep ? (
    <UnskippableModal
      proceed={handleCleanUpAndClose}
      goBack={cancelExit}
      isOnDevice={isOnDevice}
      isRobotMoving={isCommandMutationLoading || isDeleteLoading}
    />
  ) : (
    <ExitModal
      isRobotMoving={isCommandMutationLoading || isDeleteLoading}
      goBack={cancelExit}
      proceed={handleCleanUpAndClose}
      flowType={flowType}
      isOnDevice={isOnDevice}
    />
  )

  if (currentStep == null) {
    return null
  }

  const isFatalError =
    !isDoorOpenError &&
    ((isExiting && errorMessage != null) ||
      maintenanceRunData?.data.status === RUN_STATUS_FAILED ||
      (errorMessage != null && createdMaintenanceRunId == null))

  let onExit: () => void
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  // These flows often have custom error messaging, so this fallback modal is shown only in specific circumstances.
  if (isFatalError) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('shared:error_encountered')}
        subHeader={errorMessage ?? undefined}
      />
    )
  } else if (isDoorOpenError) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_is_open')}
        subHeader={t('close_door_and_try_again')}
      >
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={Boolean(isOnDevice) ? ALIGN_CENTER : ALIGN_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          {Boolean(isOnDevice) ? (
            <SmallButton
              buttonText={t('try_again')}
              onClick={dismissDoorOpenError}
            />
          ) : (
            <PrimaryButton onClick={dismissDoorOpenError}>
              {t('try_again')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    )
  } else if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    onExit = handleCleanUpAndClose
    modalContent = (
      <BeforeBeginning
        {...currentStep}
        {...calibrateBaseProps}
        createMaintenanceRun={createTargetedMaintenanceRun}
        createdMaintenanceRunId={createdMaintenanceRunId}
        isCreateLoading={isCreateLoading}
        deckConfig={deckConfig}
        requiredPipette={requiredPipette}
        documentationState={commandDocState}
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
        deckConfig={deckConfig}
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
        subsystem={
          currentStep.mount === LEFT ? 'pipette_left' : 'pipette_right'
        }
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
  } else if (currentStep.section === SECTIONS.REMOVE_WASTE_CHUTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <RemoveWasteChute {...currentStep} {...calibrateBaseProps} />
    )
  } else if (currentStep.section === SECTIONS.ATTACH_WASTE_CHUTE) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <AttachWasteChute {...currentStep} {...calibrateBaseProps} />
    )
  }
  const buildWizardOnExit = (): (() => void) => {
    if (isFatalError || showConfirmExit) {
      return handleCleanUpAndClose
    } else {
      return onExit
    }
  }

  const progressBarForCalError =
    currentStep.section === SECTIONS.DETACH_PROBE && errorMessage != null

  const wizardHeader = (
    <WizardHeader
      title={memoizedWizardTitle}
      currentStep={
        progressBarForCalError ? currentStepIndex - 1 : currentStepIndex
      }
      totalSteps={totalStepCount}
      onExit={buildWizardOnExit()}
      exitDisabled={isCommandMutationLoading || isFetchingPipettes}
    />
  )

  return createPortal(
    isOnDevice ? (
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
            ? '30rem'
            : 'auto'
        }
        header={wizardHeader}
      >
        {modalContent}
      </ModalShell>
    ),
    getTopPortalEl()
  )
}

type PipetteWizardFlowsModalProps = PipetteWizardFlowsProps & {
  robotName: string | null
}

export const handlePipetteWizardFlows = (
  props: PipetteWizardFlowsModalProps
): void => {
  NiceModal.show(NiceModalPipetteWizardFlows, props)
}

const NiceModalPipetteWizardFlows = NiceModal.create(
  (props: PipetteWizardFlowsModalProps): JSX.Element => {
    const { robotName, ...pipetteWizardFlowsProps } = props
    const modal = useModal()
    const closeFlowAndModal = (): void => {
      props.closeFlow()
      modal.remove()
    }

    return (
      <ApiHostProvider robotName={robotName}>
        <PipetteWizardFlows
          {...pipetteWizardFlowsProps}
          closeFlow={closeFlowAndModal}
        />
      </ApiHostProvider>
    )
  }
)
