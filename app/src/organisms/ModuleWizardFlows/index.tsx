import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'

import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useAttachedPipettesFromInstrumentsQuery } from '../../organisms/Devices/hooks'
import { useChainMaintenanceCommands } from '../../resources/runs/hooks'
import { getIsOnDevice } from '../../redux/config'
import { getModuleCalibrationSteps } from './getModuleCalibrationSteps'
import { SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'
import { Success } from './Success'

import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import { FirmwareUpdate } from './FirmwareUpdate'

interface ModuleWizardFlowsProps {
  attachedModule: AttachedModule
  closeFlow: () => void
  slotName?: string
  onComplete?: () => void
}

const RUN_REFETCH_INTERVAL = 5000

export const ModuleWizardFlows = (
  props: ModuleWizardFlowsProps
): JSX.Element | null => {
  const { attachedModule, slotName, closeFlow, onComplete } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')

  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()

  const moduleCalibrationSteps = getModuleCalibrationSteps()
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = moduleCalibrationSteps.length - 1
  const currentStep = moduleCalibrationSteps?.[currentStepIndex]

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== totalStepCount ? 0 : currentStepIndex
    )
  }
  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
  })
  const {
    chainRunCommands,
    isCommandMutationLoading,
  } = useChainMaintenanceCommands()

  const [createdRunId, setCreatedRunId] = React.useState<string | null>(null)
  const {
    createMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateMaintenanceRunMutation({
    onSuccess: response => {
      setCreatedRunId(response.data.id)
    },
  })
  const prevMaintenanceRunId = React.useRef<string | undefined>(
    maintenanceRunData?.data.id
  )
  // this will close the modal in case the run was deleted by the terminate
  // activity modal on the ODD
  React.useEffect(() => {
    if (
      maintenanceRunData?.data.id == null &&
      prevMaintenanceRunId != null &&
      createdRunId != null
    ) {
      closeFlow()
    }
  }, [maintenanceRunData, closeFlow])

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

  if (
    maintenanceRunData?.data.id != null &&
    maintenanceRunData.data.id === createdRunId
  ) {
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

  const calibrateBaseProps = {
    attachedPipettes,
    chainRunCommands: chainMaintenanceRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId: maintenanceRunData?.data.id,
    goBack,
    setErrorMessage,
    errorMessage,
    isOnDevice,
    attachedModule,
    slotName,
  }
  if (currentStep == null) return null
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (isExiting) {
    modalContent = <InProgressModal description={t('stand_back')} />
  }
  if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    modalContent = (
      <BeforeBeginning
        {...currentStep}
        {...calibrateBaseProps}
        createMaintenanceRun={createMaintenanceRun}
        isCreateLoading={isCreateLoading}
      />
    )
  } else if (currentStep.section === SECTIONS.FIRMWARE_UPDATE) {
    modalContent = <FirmwareUpdate {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.SELECT_LOCATION) {
    modalContent = <SelectLocation {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.PLACE_ADAPTER) {
    modalContent = <PlaceAdapter {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.ATTACH_PROBE) {
    modalContent = <AttachProbe {...currentStep} {...calibrateBaseProps} />
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
