import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
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
  CreateMaintenanceRunType,
} from '@opentrons/react-api-client'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getIsOnDevice } from '../../redux/config'
import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../resources/runs/hooks'
import { StyledText } from '../../atoms/text'
import { Jog } from '../../molecules/JogControls'
import { ExitConfirmation } from './ExitConfirmation'
import { getDropTipWizardSteps } from './getDropTipWizardSteps'
import {
  BLOWOUT_SUCCESS,
  CHOOSE_BLOWOUT_LOCATION,
  CHOOSE_DROP_TIP_LOCATION,
  DROP_TIP_SUCCESS,
  POSITION_AND_BLOWOUT,
  POSITION_AND_DROP_TIP,
} from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { ChooseLocation } from './ChooseLocation'
import { JogToPosition } from './JogToPosition'
import { Success } from './Success'

import type { PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs, RobotType } from '@opentrons/shared-data'

const RUN_REFETCH_INTERVAL = 5000

interface MaintenanceRunManagerProps {
  robotType: RobotType
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  closeFlow: () => void
  onComplete?: () => void
}
export function DropTipWizard(props: MaintenanceRunManagerProps): JSX.Element {
  const { closeFlow, mount, instrumentModelSpecs, robotType } = props
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
    <DropTipWizardComponent
      robotType={robotType}
      createdMaintenanceRunId={createdMaintenanceRunId}
      maintenanceRunId={maintenanceRunData?.data.id}
      mount={mount}
      instrumentModelSpecs={instrumentModelSpecs}
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
  robotType: RobotType
  mount: PipetteData['mount']
  createdMaintenanceRunId: string | null
  createMaintenanceRun: CreateMaintenanceRunType
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
  instrumentModelSpecs: PipetteModelSpecs
  maintenanceRunId?: string
}

export const DropTipWizardComponent = (
  props: DropTipWizardProps
): JSX.Element | null => {
  const {
    robotType,
    // maintenanceRunId,
    createMaintenanceRun,
    handleCleanUpAndClose,
    // chainRunCommands,
    // attachedInstrument,
    isCreateLoading,
    isRobotMoving,
    // createRunCommand,
    // setErrorMessage,
    errorMessage,
    // isExiting,
    createdMaintenanceRunId,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t, i18n } = useTranslation('drop_tip_wizard')

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const [shouldDispenseLiquid, setShouldDispenseLiquid] = React.useState<
    boolean | null
  >(null)
  const DropTipWizardSteps = getDropTipWizardSteps(shouldDispenseLiquid)
  const currentStep =
    shouldDispenseLiquid != null
      ? getDropTipWizardSteps(shouldDispenseLiquid)[currentStepIndex]
      : null
  const isFinalStep = currentStepIndex === DropTipWizardSteps.length - 1
  const goBack = (): void => {
    setCurrentStepIndex(isFinalStep ? currentStepIndex : currentStepIndex - 1)
  }

  const proceed = (): void => {
    if (isFinalStep) {
      handleCleanUpAndClose()
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }
  const handleJog: Jog = (axis, direction, step) => {
    console.log('TODO Jog with params: ', axis, direction, step)
  }

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
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmExit) {
    modalContent = (
      <ExitConfirmation
        handleGoBack={cancelExit}
        handleExit={confirmExit}
        isRobotMoving={isRobotMoving}
      />
    )
  } else if (shouldDispenseLiquid == null) {
    modalContent = (
      <BeforeBeginning
        {...{
          createMaintenanceRun,
          isCreateLoading,
          createdMaintenanceRunId,
          setShouldDispenseLiquid,
        }}
      />
    )
  } else if (
    currentStep === CHOOSE_BLOWOUT_LOCATION ||
    currentStep === CHOOSE_DROP_TIP_LOCATION
  ) {
    modalContent = (
      <ChooseLocation
        robotType={robotType}
        handleProceed={proceed}
        title={
          currentStep === CHOOSE_BLOWOUT_LOCATION
            ? t('choose_blowout_location')
            : t('choose_drop_tip_location')
        }
        body={
          <Trans
            t={t}
            i18nKey={
              currentStep === CHOOSE_BLOWOUT_LOCATION
                ? 'select_blowout_slot'
                : 'select_drop_tip_slot'
            }
            components={{ block: <StyledText as="p" /> }}
          />
        }
      />
    )
  } else if (
    currentStep === POSITION_AND_BLOWOUT ||
    currentStep === POSITION_AND_DROP_TIP
  ) {
    modalContent = (
      <JogToPosition
        handleJog={handleJog}
        handleProceed={proceed}
        handleGoBack={goBack}
        body={
          currentStep === POSITION_AND_BLOWOUT
            ? t('position_and_blowout')
            : t('position_and_drop_tip')
        }
      />
    )
  } else if (
    currentStep === BLOWOUT_SUCCESS ||
    currentStep === DROP_TIP_SUCCESS
  ) {
    modalContent = (
      <Success
        message={
          currentStep === BLOWOUT_SUCCESS
            ? t('blowout_complete')
            : t('drop_tip_complete')
        }
        handleProceed={
          currentStep === BLOWOUT_SUCCESS ? proceed : handleCleanUpAndClose
        }
        proceedText={
          currentStep === BLOWOUT_SUCCESS
            ? t('shared:continue')
            : t('shared:exit')
        }
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
      title={i18n.format(t('drop_tips'), 'capitalize')}
      currentStep={shouldDispenseLiquid != null ? currentStepIndex + 1 : null}
      totalSteps={DropTipWizardSteps.length}
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
