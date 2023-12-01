import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  useDeleteMaintenanceRunMutation,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import { COLORS } from '@opentrons/components'
import {
  CreateCommand,
  getModuleType,
  getModuleDisplayName,
  LEFT,
} from '@opentrons/shared-data'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useAttachedPipettesFromInstrumentsQuery } from '../../organisms/Devices/hooks'
import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../resources/runs/hooks'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getModuleCalibrationSteps } from './getModuleCalibrationSteps'
import { FLEX_SLOT_NAMES_BY_MOD_TYPE, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'
import { Success } from './Success'
import { DetachProbe } from './DetachProbe'
import { FirmwareUpdateModal } from '../FirmwareUpdateModal'

import type { AttachedModule, CommandData } from '@opentrons/api-client'

interface ModuleWizardFlowsProps {
  attachedModule: AttachedModule
  closeFlow: () => void
  isPrepCommandLoading: boolean
  initialSlotName?: string
  onComplete?: () => void
  prepCommandErrorMessage?: string
}

const RUN_REFETCH_INTERVAL = 5000

export const ModuleWizardFlows = (
  props: ModuleWizardFlowsProps
): JSX.Element | null => {
  const {
    attachedModule,
    initialSlotName,
    isPrepCommandLoading,
    closeFlow,
    onComplete,
    prepCommandErrorMessage,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const attachedPipette =
    attachedPipettes.left?.data.calibratedOffset?.last_modified != null
      ? attachedPipettes.left
      : attachedPipettes.right

  const moduleCalibrationSteps = getModuleCalibrationSteps()
  const availableSlotNames =
    FLEX_SLOT_NAMES_BY_MOD_TYPE[getModuleType(attachedModule.moduleModel)] ?? []
  const [slotName, setSlotName] = React.useState(
    initialSlotName != null ? initialSlotName : availableSlotNames?.[0] ?? 'D1'
  )
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = moduleCalibrationSteps.length - 1
  const currentStep = moduleCalibrationSteps?.[currentStepIndex]

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex === 0 ? currentStepIndex : currentStepIndex - 1
    )
  }
  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)
  const [createdAdapterId, setCreatedAdapterId] = React.useState<string | null>(
    null
  )
  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = React.useState<boolean>(false)

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
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: response => {
      setCreatedMaintenanceRunId(response.data.id)
    },
  })

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

  const [errorMessage, setErrorMessage] = React.useState<null | string>(null)
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
        maintenanceRunData?.data.id,
        commands,
        continuePastCommandFailure
      )
  }
  if (
    currentStep == null ||
    attachedPipette?.data.calibratedOffset?.last_modified == null
  )
    return null

  const maintenanceRunId =
    maintenanceRunData?.data.id != null &&
    maintenanceRunData?.data.id === createdMaintenanceRunId
      ? createdMaintenanceRunId
      : undefined
  const calibrateBaseProps = {
    attachedPipette,
    chainRunCommands: chainMaintenanceRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId,
    goBack,
    setErrorMessage,
    errorMessage,
    isOnDevice,
    attachedModule,
    slotName,
    isExiting,
  }

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (isPrepCommandLoading) {
    modalContent = (
      <InProgressModal
        description={t('prepping_module', {
          module: getModuleDisplayName(attachedModule.moduleModel),
        })}
      />
    )
  } else if (prepCommandErrorMessage != null || errorMessage != null) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.errorEnabled}
        header={t(
          prepCommandErrorMessage != null
            ? 'error_prepping_module'
            : 'error_during_calibration'
        )}
        subHeader={
          prepCommandErrorMessage != null ? (
            prepCommandErrorMessage
          ) : (
            <>
              {t('module_calibration_failed')}
              {errorMessage}
            </>
          )
        }
      />
    )
  } else if (isExiting) {
    modalContent = <InProgressModal description={t('stand_back_exiting')} />
  } else if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    modalContent = (
      <BeforeBeginning
        {...currentStep}
        {...calibrateBaseProps}
        createMaintenanceRun={createTargetedMaintenanceRun}
        isCreateLoading={isCreateLoading}
        createdMaintenanceRunId={createdMaintenanceRunId}
      />
    )
  } else if (currentStep.section === SECTIONS.FIRMWARE_UPDATE) {
    modalContent = (
      <FirmwareUpdateModal
        proceed={proceed}
        subsystem={
          attachedPipette.mount === LEFT ? 'pipette_left' : 'pipette_right'
        }
        description={t('firmware_update')}
        proceedDescription={t('firmware_up_to_date', {
          module: getModuleDisplayName(attachedModule.moduleModel),
        })}
        isOnDevice={isOnDevice}
      />
    )
  } else if (currentStep.section === SECTIONS.SELECT_LOCATION) {
    modalContent = (
      <SelectLocation
        {...currentStep}
        {...calibrateBaseProps}
        availableSlotNames={availableSlotNames}
        setSlotName={setSlotName}
      />
    )
  } else if (currentStep.section === SECTIONS.PLACE_ADAPTER) {
    modalContent = (
      <PlaceAdapter
        {...currentStep}
        {...calibrateBaseProps}
        setCreatedAdapterId={setCreatedAdapterId}
      />
    )
  } else if (currentStep.section === SECTIONS.ATTACH_PROBE) {
    modalContent = (
      <AttachProbe
        {...currentStep}
        {...calibrateBaseProps}
        adapterId={createdAdapterId}
      />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PROBE) {
    modalContent = <DetachProbe {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.SUCCESS) {
    modalContent = (
      <Success
        {...currentStep}
        {...calibrateBaseProps}
        isRobotMoving={isRobotMoving}
        proceed={isRobotMoving ? () => {} : handleCleanUpAndClose}
      />
    )
  }

  const wizardHeader = (
    <WizardHeader
      exitDisabled={isRobotMoving}
      title={t('module_calibration')}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={isRobotMoving ? undefined : handleCleanUpAndClose}
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
        <LegacyModalShell width="47rem" height="auto" header={wizardHeader}>
          {modalContent}
        </LegacyModalShell>
      )}
    </Portal>
  )
}
