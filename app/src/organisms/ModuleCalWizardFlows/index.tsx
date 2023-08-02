import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  useHost,
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useChainMaintenanceCommands } from '../../resources/runs/hooks'
import { getIsOnDevice } from '../../redux/config'
import { getModuleCalibrationSteps } from './getModuleCalibrationSteps'
import { SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'

import type { AttachedModule } from '@opentrons/api-client'

interface ModuleCalWizardFlowsProps {
  attachedModule: AttachedModule
  slotName: string
  closeFlow: () => void
  onComplete?: () => void
}

export const ModuleCalWizardFlows = (
  props: ModuleCalWizardFlowsProps
): JSX.Element | null => {
  const { attachedModule, slotName, closeFlow, onComplete } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_calibration_wizard_flows')

  const moduleCalibrationSteps = getModuleCalibrationSteps()
  const host = useHost()
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string>('')
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = moduleCalibrationSteps.length - 1
  const currentStep = moduleCalibrationSteps?.[currentStepIndex]

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
    if (maintenanceRunId == null) handleClose()
    else {
      chainRunCommands([{ commandType: 'home' as const, params: {} }], false)
        .then(() => {
          deleteMaintenanceRun(maintenanceRunId)
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

  const calibrateBaseProps = {
    chainRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId,
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
    // TODO: create firmware update step
  } else if (currentStep.section === SECTIONS.SELECT_LOCATION) {
    modalContent = <SelectLocation {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.PLACE_ADAPTER) {
    modalContent = <PlaceAdapter {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.ATTACH_PROBE) {
    modalContent = <AttachProbe {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.SUCCESS) {
    // TODO: create success step and error handling
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
