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
  BORDERS,
} from '@opentrons/components'
import {
  useCreateMaintenanceCommandMutation,
  useDeleteMaintenanceRunMutation,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getIsOnDevice } from '../../redux/config'
import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../resources/runs/hooks'

import type { AxiosError } from 'axios'
import type {
  CreateMaintenanceRunData,
  InstrumentData,
  MaintenanceRun,
} from '@opentrons/api-client'
import { ExitConfirmation } from './ExitConfirmation'

const RUN_REFETCH_INTERVAL = 5000

interface MaintenanceRunManagerProps {
  attachedInstrument: InstrumentData | null
  closeFlow: () => void
  onComplete?: () => void
}
export function DropTipWizardFlows(
  props: MaintenanceRunManagerProps
): JSX.Element {
  const { closeFlow, attachedInstrument } = props
  const {
    chainRunCommands,
    isCommandMutationLoading: isChainCommandMutationLoading,
  } = useChainMaintenanceCommands()
  const {
    createMaintenanceCommand,
    isLoading: isCommandLoading,
  } = useCreateMaintenanceCommandMutation()

  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)

  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = React.useState<boolean>(false)

  const {
    createTargetedMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: response => {
      setCreatedMaintenanceRunId(response.data.id)
    },
  })

  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: createdMaintenanceRunId != null,
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

  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<null | string>(null)

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => closeFlow(),
    onError: () => closeFlow(),
  })

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) {
      closeFlow()
    } else {
      chainRunCommands(
        maintenanceRunData?.data.id,
        [{ commandType: 'home' as const, params: {} }],
        true
      )
        .then(() => {
          deleteMaintenanceRun(maintenanceRunData?.data.id)
          setIsExiting(false)
          props.onComplete?.()
        })
        .catch(error => {
          console.error(error.message)
          deleteMaintenanceRun(maintenanceRunData?.data.id)
          setIsExiting(false)
          props.onComplete?.()
        })
    }
  }

  return (
    <DropTipWizard
      createdMaintenanceRunId={createdMaintenanceRunId}
      maintenanceRunId={maintenanceRunData?.data.id}
      attachedInstrument={attachedInstrument}
      createMaintenanceRun={createTargetedMaintenanceRun}
      isCreateLoading={isCreateLoading}
      isRobotMoving={
        isChainCommandMutationLoading || isCommandLoading || isExiting
      }
      handleCleanUpAndClose={handleCleanUpAndClose}
      chainRunCommands={chainRunCommands}
      createRunCommand={createMaintenanceCommand}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
      isExiting={isExiting}
    />
  )
}

interface DropTipWizardProps {
  maintenanceRunId?: string
  createdMaintenanceRunId: string | null
  attachedInstrument: InstrumentData | null
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
  isRobotMoving: boolean
  isExiting: boolean
  setErrorMessage: (message: string | null) => void
  errorMessage: string | null
  handleCleanUpAndClose: () => void
  chainRunCommands: ReturnType<
    typeof useChainMaintenanceCommands
  >['chainRunCommands']
  createRunCommand: ReturnType<
    typeof useCreateMaintenanceCommandMutation
  >['createMaintenanceCommand']
}

export const DropTipWizard = (
  props: DropTipWizardProps
): JSX.Element | null => {
  const {
    // maintenanceRunId,
    // createMaintenanceRun,
    handleCleanUpAndClose,
    // chainRunCommands,
    // attachedInstrument,
    // isCreateLoading,
    isRobotMoving,
    // createRunCommand,
    // setErrorMessage,
    errorMessage,
    // isExiting,
    // createdMaintenanceRunId,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('drop_tip_wizard')
  const DropTipWizardSteps = []
  const [currentStepIndex] = React.useState<number>(0)

  const totalStepCount = DropTipWizardSteps.length - 1
  // const currentStep = DropTipWizardSteps?.[currentStepIndex]
  // const isFinalStep = currentStepIndex === DropTipWizardSteps.length - 1
  // const goBack = (): void => {
  //   setCurrentStepIndex(isFinalStep ? currentStepIndex : currentStepIndex - 1)
  // }

  // const handleProceed = (): void => {
  //   if (isFinalStep) {
  //     handleCleanUpAndClose()
  //   } else {
  //     setCurrentStepIndex(currentStepIndex + 1)
  //   }
  // }

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  // let chainMaintenanceRunCommands

  // if (maintenanceRunId != null) {
  //   chainMaintenanceRunCommands = (
  //     commands: CreateCommand[],
  //     continuePastCommandFailure: boolean
  //   ): Promise<CommandData[]> =>
  //     chainRunCommands(maintenanceRunId, commands, continuePastCommandFailure)
  // }

  // const sharedProps = {
  //   maintenanceRunId:
  //     maintenanceRunId != null && createdMaintenanceRunId === maintenanceRunId
  //       ? maintenanceRunId
  //       : undefined,
  //   isCreateLoading,
  //   isRobotMoving,
  //   attachedInstrument,
  //   proceed: handleProceed,
  //   goBack,
  //   chainRunCommands: chainMaintenanceRunCommands,
  //   setErrorMessage,
  //   errorMessage,
  // }
  // if (currentStep == null) return null
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmExit) {
    modalContent = (
      <ExitConfirmation
        handleGoBack={cancelExit}
        handleExit={confirmExit}
        isRobotMoving={isRobotMoving}
      />
    )
  }

  let handleExit: (() => void) | undefined = confirmExit
  if (isRobotMoving) {
    handleExit = undefined
  } else if (showConfirmExit || errorMessage != null) {
    handleExit = handleCleanUpAndClose
  }

  const wizardHeader = (
    <WizardHeader
      title={t('drop_tips')}
      currentStep={currentStepIndex + 1}
      totalSteps={totalStepCount + 1}
      onExit={handleExit}
    />
  )

  return (
    <Portal level="top">
      {isOnDevice ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          width="992px"
          height="568px"
          left="14.5px"
          top="16px"
          border={BORDERS.lineBorder}
          boxShadow={BORDERS.shadowSmall}
          borderRadius={BORDERS.borderRadiusSize4}
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
