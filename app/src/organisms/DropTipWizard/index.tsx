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
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
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

import type { PipetteData, CommandData } from '@opentrons/api-client'
import type {
  Coordinates,
  PipetteModelSpecs,
  RobotType,
  SavePositionRunTimeCommand,
  CreateCommand,
} from '@opentrons/shared-data'
const RUN_REFETCH_INTERVAL_MS = 5000
const JOG_COMMAND_TIMEOUT_MS = 10000
const MANAGED_PIPETTE_ID = 'managedPipetteId'

interface MaintenanceRunManagerProps {
  robotType: RobotType
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  closeFlow: () => void
}
export function DropTipWizard(props: MaintenanceRunManagerProps): JSX.Element {
  const { closeFlow, mount, instrumentModelSpecs, robotType } = props
  const {
    chainRunCommands,
    isCommandMutationLoading: isChainCommandMutationLoading,
  } = useChainMaintenanceCommands()
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()

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
      chainRunCommands(
        response.data.id,
        [
          {
            commandType: 'loadPipette',
            params: {
              pipetteId: MANAGED_PIPETTE_ID,
              mount: mount,
              pipetteName: instrumentModelSpecs.name,
            },
          },
        ],
        false
      )
        .then(() => {
          setCreatedMaintenanceRunId(response.data.id)
        })
        .catch(e => e)
    },
  })

  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL_MS,
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
      deleteMaintenanceRun(maintenanceRunData?.data.id, {
        onSuccess: () => {
          closeFlow()
          setIsExiting(false)
        },
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
      isRobotMoving={isChainCommandMutationLoading || isExiting}
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
    createMaintenanceRun,
    handleCleanUpAndClose,
    chainRunCommands,
    // attachedInstrument,
    isCreateLoading,
    isRobotMoving,
    createRunCommand,
    setErrorMessage,
    errorMessage,
    isExiting,
    createdMaintenanceRunId,
    instrumentModelSpecs,
  } = props
  console.log(
    '🚀 ~ file: index.tsx:215 ~ createdMaintenanceRunId:',
    createdMaintenanceRunId
  )
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
  const handleJog: Jog = (axis, dir, step) => {
    if (createdMaintenanceRunId != null) {
      createRunCommand({
        maintenanceRunId: createdMaintenanceRunId,
        command: {
          commandType: 'moveRelative',
          params: { pipetteId: MANAGED_PIPETTE_ID, distance: step * dir, axis },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT_MS,
      })
        .then(data => {})
        .catch((e: Error) =>
          setErrorMessage(`error issuing jog command: ${e.message}`)
        )
    }
  }

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const handleCreateAndSetup = (shouldDispenseLiquid: boolean): void => {
    createMaintenanceRun({})
      .then(() => {
        setShouldDispenseLiquid(shouldDispenseLiquid)
      })
      .catch(e =>
        setErrorMessage(`error setting up blowout/droptip: ${e.message}`)
      )
  }

  const retractAllAxesAndSavePosition = (): Promise<Coordinates | null> => {
    if (createdMaintenanceRunId == null)
      return Promise.reject<Coordinates>(
        new Error('no maintenance run present to send move commands to')
      )
    const commands: CreateCommand[] = [
      {
        commandType: 'retractAxis' as const,
        params: {
          axis: 'leftZ',
        },
      },
      {
        commandType: 'retractAxis' as const,
        params: {
          axis: 'rightZ',
        },
      },
      {
        commandType: 'retractAxis' as const,
        params: { axis: 'x' },
      },
      {
        commandType: 'retractAxis' as const,
        params: { axis: 'y' },
      },
      {
        commandType: 'savePosition' as const,
        params: {
          pipetteId: MANAGED_PIPETTE_ID,
        },
      },
    ]
    return chainRunCommands(createdMaintenanceRunId, commands, false)
      .then(responses => {
        if (responses.length !== commands.length) {
          return Promise.reject(
            new Error('not all commands executed successfully')
          )
        }
        const currentPosition = (responses[responses.length - 1]
          .data as SavePositionRunTimeCommand).result?.position
        if (currentPosition != null) {
          return Promise.resolve(currentPosition)
        } else {
          return Promise.reject(
            new Error('current position could not be saved')
          )
        }
      })
      .catch(e => {
        setErrorMessage(
          `error retracting x and y axes or saving position: ${e.message}`
        )
        return null
      })
  }

  const moveToXYCoordinate = (
    x: number,
    y: number
  ): Promise<CommandData[] | null> => {
    if (createdMaintenanceRunId == null)
      return Promise.reject(
        new Error('no maintenance run present to send move commands to')
      )

    return retractAllAxesAndSavePosition()
      .then(currentPosition => {
        if (currentPosition != null) {
          return chainRunCommands(
            createdMaintenanceRunId,
            [
              {
                commandType: 'moveRelative',
                params: {
                  pipetteId: MANAGED_PIPETTE_ID,
                  distance: y - currentPosition.y,
                  axis: 'y',
                },
              },
              {
                commandType: 'moveRelative',
                params: {
                  pipetteId: MANAGED_PIPETTE_ID,
                  distance: x - currentPosition.x,
                  axis: 'x',
                },
              },
            ],
            true
          )
        } else return null
      })
      .catch(e => {
        setErrorMessage(`error moving to position: ${e.message}`)
        return null
      })
  }

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmExit) {
    modalContent = (
      <ExitConfirmation
        handleGoBack={cancelExit}
        handleExit={confirmExit}
        isRobotMoving={isRobotMoving}
      />
    )
  } else if (errorMessage != null) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.errorEnabled}
        header={t('error_dropping_tips')}
        subHeader={
          <>
            {t('drop_tip_failed')}
            {errorMessage}
          </>
        }
      />
    )
  } else if (shouldDispenseLiquid == null) {
    modalContent = (
      <BeforeBeginning
        {...{
          handleCreateAndSetup,
          isCreateLoading,
          isOnDevice,
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
            ? i18n.format(t('choose_blowout_location'), 'capitalize')
            : i18n.format(t('choose_drop_tip_location'), 'capitalize')
        }
        body={
          <Trans
            t={t}
            i18nKey={
              currentStep === CHOOSE_BLOWOUT_LOCATION
                ? isOnDevice
                  ? i18n.format(t('select_blowout_slot_odd'))
                  : i18n.format(t('select_blowout_slot'))
                : isOnDevice
                ? i18n.format(t('select_drop_tip_slot_odd'))
                : i18n.format(t('select_drop_tip_slot'))
            }
            components={{ block: <StyledText as="p" /> }}
          />
        }
        moveToXYCoordinate={moveToXYCoordinate}
        isRobotMoving={isRobotMoving}
        isOnDevice={isOnDevice}
        setErrorMessage={setErrorMessage}
      />
    )
  } else if (
    currentStep === POSITION_AND_BLOWOUT ||
    currentStep === POSITION_AND_DROP_TIP
  ) {
    modalContent = (
      <JogToPosition
        handleJog={handleJog}
        handleProceed={() => {
          if (createdMaintenanceRunId != null) {
            chainRunCommands(
              createdMaintenanceRunId,
              [
                currentStep === POSITION_AND_BLOWOUT
                  ? {
                      commandType: 'blowOutInPlace',
                      params: {
                        pipetteId: MANAGED_PIPETTE_ID,
                        flowRate:
                          instrumentModelSpecs.defaultBlowOutFlowRate.value,
                      },
                    }
                  : {
                      commandType: 'dropTipInPlace',
                      params: { pipetteId: MANAGED_PIPETTE_ID },
                    },
              ],
              true
            )
              .then(() => {
                retractAllAxesAndSavePosition()
                  .then(() => proceed())
                  .catch(e =>
                    setErrorMessage(`error moving to position: ${e.message}`)
                  )
              })
              .catch(e =>
                setErrorMessage(
                  `error issuing ${
                    currentStep === POSITION_AND_BLOWOUT
                      ? 'blowout'
                      : 'drop tip'
                  } command: ${e.message}`
                )
              )
          }
        }}
        isRobotMoving={isRobotMoving}
        handleGoBack={goBack}
        body={
          currentStep === POSITION_AND_BLOWOUT
            ? t('position_and_blowout')
            : t('position_and_drop_tip')
        }
        createdMaintenanceRunId={createdMaintenanceRunId}
        pipetteId={MANAGED_PIPETTE_ID}
        instrumentModelSpecs={instrumentModelSpecs}
        chainRunCommands={chainRunCommands}
        currentStep={currentStep}
        isOnDevice={isOnDevice}
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
            ? i18n.format(t('shared:continue'), 'capitalize')
            : i18n.format(t('shared:exit'), 'capitalize')
        }
        isRobotMoving={isRobotMoving}
        isExiting={isExiting}
        isOnDevice={isOnDevice}
      />
    )
  }

  let handleExit: (() => void) | undefined = confirmExit
  if (isRobotMoving || showConfirmExit) {
    handleExit = undefined
  } else if (errorMessage != null) {
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
