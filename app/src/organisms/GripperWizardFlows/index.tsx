import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { UseMutateFunction } from 'react-query'
import {
  useConditionalConfirm,
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  COLORS,
} from '@opentrons/components'
import {
  useCreateMaintenanceCommandMutation,
  useCreateMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getIsOnDevice } from '../../redux/config'
import { useChainMaintenanceCommands } from '../../resources/runs/hooks'
import { getGripperWizardSteps } from './getGripperWizardSteps'
import { GRIPPER_FLOW_TYPES, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { MovePin } from './MovePin'
import { MountGripper } from './MountGripper'
import { UnmountGripper } from './UnmountGripper'
import { Success } from './Success'
import { ExitConfirmation } from './ExitConfirmation'

import type { GripperWizardFlowType } from './types'
import type { AxiosError } from 'axios'
import type {
  CreateMaintenanceRunData,
  InstrumentData,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { Coordinates } from '@opentrons/shared-data'

interface MaintenanceRunManagerProps {
  flowType: GripperWizardFlowType
  attachedGripper: InstrumentData | null
  closeFlow: () => void
}
export function GripperWizardFlows(
  props: MaintenanceRunManagerProps
): JSX.Element {
  const { flowType, closeFlow, attachedGripper } = props
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string>('')
  const {
    chainRunCommands,
    isCommandMutationLoading: isChainCommandMutationLoading,
  } = useChainMaintenanceCommands(maintenanceRunId)
  const {
    createMaintenanceCommand,
    isLoading: isCommandLoading,
  } = useCreateMaintenanceCommandMutation(maintenanceRunId)

  const {
    createMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateMaintenanceRunMutation({
    onSuccess: response => {
      setMaintenanceRunId(response.data.id)
    },
  })
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    chainRunCommands([{ commandType: 'home' as const, params: {} }], true).then(
      () => {
        setIsExiting(false)
        closeFlow()
      }
    )
  }

  return (
    <GripperWizard
      flowType={flowType}
      maintenanceRunId={maintenanceRunId}
      attachedGripper={attachedGripper}
      createMaintenanceRun={createMaintenanceRun}
      isCreateLoading={isCreateLoading}
      isRobotMoving={
        isChainCommandMutationLoading || isCommandLoading || isExiting
      }
      handleCleanUpAndClose={handleCleanUpAndClose}
      chainRunCommands={chainRunCommands}
      createRunCommand={createMaintenanceCommand}
    />
  )
}

interface GripperWizardProps {
  flowType: GripperWizardFlowType
  maintenanceRunId: string
  attachedGripper: InstrumentData | null
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
  isRobotMoving: boolean
  handleCleanUpAndClose: () => void
  chainRunCommands: ReturnType<
    typeof useChainMaintenanceCommands
  >['chainRunCommands']
  createRunCommand: ReturnType<
    typeof useCreateMaintenanceCommandMutation
  >['createMaintenanceCommand']
}

export const GripperWizard = (
  props: GripperWizardProps
): JSX.Element | null => {
  const {
    flowType,
    maintenanceRunId,
    createMaintenanceRun,
    handleCleanUpAndClose,
    chainRunCommands,
    attachedGripper,
    isCreateLoading,
    isRobotMoving,
    createRunCommand,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('gripper_wizard_flows')
  const gripperWizardSteps = getGripperWizardSteps(flowType)
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const [
    frontJawOffset,
    setFrontJawOffset,
  ] = React.useState<Coordinates | null>(null)

  const totalStepCount = gripperWizardSteps.length - 1
  const currentStep = gripperWizardSteps?.[currentStepIndex]
  const isFinalStep = currentStepIndex === gripperWizardSteps.length - 1
  const goBack = (): void => {
    setCurrentStepIndex(isFinalStep ? currentStepIndex : currentStepIndex - 1)
  }

  const handleProceed = (): void => {
    if (isFinalStep) {
      handleCleanUpAndClose()
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const sharedProps = {
    flowType,
    maintenanceRunId,
    isCreateLoading,
    isRobotMoving,
    attachedGripper,
    proceed: handleProceed,
    goBack,
    chainRunCommands,
  }
  let onExit
  if (currentStep == null) return null
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmExit) {
    modalContent = (
      <ExitConfirmation
        handleGoBack={cancelExit}
        handleExit={confirmExit}
        flowType={flowType}
      />
    )
  } else if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    onExit = handleCleanUpAndClose
    modalContent = (
      <BeforeBeginning
        {...currentStep}
        {...sharedProps}
        createMaintenanceRun={createMaintenanceRun}
      />
    )
  } else if (currentStep.section === SECTIONS.MOVE_PIN) {
    onExit = confirmExit
    modalContent = modalContent = (
      <MovePin
        {...currentStep}
        {...sharedProps}
        {...{ setFrontJawOffset, frontJawOffset, createRunCommand }}
      />
    )
  } else if (currentStep.section === SECTIONS.MOUNT_GRIPPER) {
    onExit = confirmExit
    modalContent = modalContent = (
      <MountGripper {...currentStep} {...sharedProps} />
    )
  } else if (currentStep.section === SECTIONS.UNMOUNT_GRIPPER) {
    onExit = confirmExit
    modalContent = modalContent = (
      <UnmountGripper {...currentStep} {...sharedProps} />
    )
  } else if (currentStep.section === SECTIONS.SUCCESS) {
    onExit = confirmExit
    modalContent = modalContent = (
      <Success {...currentStep} proceed={handleProceed} />
    )
  }

  const titleByFlowType: { [flowType in GripperWizardFlowType]: string } = {
    [GRIPPER_FLOW_TYPES.RECALIBRATE]: t('calibrate_gripper'),
    [GRIPPER_FLOW_TYPES.ATTACH]: t('attach_gripper'),
    [GRIPPER_FLOW_TYPES.DETACH]: t('detach_gripper'),
  }
  let handleExit = onExit
  if (isRobotMoving) {
    handleExit = undefined
  } else if (showConfirmExit) {
    handleExit = handleCleanUpAndClose
  }

  const wizardHeader = (
    <WizardHeader
      title={titleByFlowType[flowType]}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={handleExit}
    />
  )

  return (
    <Portal level="top">
      {isOnDevice ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          width="100%"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
        >
          {wizardHeader}
          {modalContent}
        </Flex>
      ) : (
        <LegacyModalShell width="48rem" header={wizardHeader}>
          {modalContent}
        </LegacyModalShell>
      )}
    </Portal>
  )
}
