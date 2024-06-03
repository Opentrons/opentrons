import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  useConditionalConfirm,
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  COLORS,
  BORDERS,
  StyledText,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  useCreateMaintenanceCommandMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { getTopPortalEl } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getIsOnDevice } from '../../redux/config'
import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../resources/runs'
import { ExitConfirmation } from './ExitConfirmation'
import { getAddressableAreaFromConfig } from './getAddressableAreaFromConfig'
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
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import {
  useHandleDropTipCommandErrors,
  useDropTipErrorComponents,
  useWizardExitHeader,
} from './utils'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type { PipetteData } from '@opentrons/api-client'
import type { CreateMaintenanceRunType } from '@opentrons/react-api-client'
import type {
  PipetteModelSpecs,
  RobotType,
  DeckConfiguration,
  AddressableAreaName,
} from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { Jog } from '../../molecules/JogControls'
import type { ErrorDetails } from './utils'
import type { DropTipWizardStep } from './types'

const RUN_REFETCH_INTERVAL_MS = 5000
const JOG_COMMAND_TIMEOUT_MS = 10000
const MANAGED_PIPETTE_ID = 'managedPipetteId'

export interface DropTipWizardProps {
  robotType: RobotType
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  closeFlow: () => void
}
export function DropTipWizard(props: DropTipWizardProps): JSX.Element {
  const { closeFlow, mount, instrumentModelSpecs, robotType } = props
  const {
    chainRunCommands,
    isCommandMutationLoading: isChainCommandMutationLoading,
  } = useChainMaintenanceCommands()
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()

  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)
  const hasCleanedUpAndClosed = React.useRef(false)

  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = React.useState<boolean>(false)

  const {
    createTargetedMaintenanceRun,
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
    onError: error => setErrorDetails({ message: error.message }),
  })

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
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
  const [errorDetails, setErrorDetails] = React.useState<null | ErrorDetails>(
    null
  )

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => closeFlow(),
    onError: () => closeFlow(),
  })

  const handleCleanUpAndClose = (homeOnExit: boolean = true): void => {
    if (hasCleanedUpAndClosed.current) return

    hasCleanedUpAndClosed.current = true
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) {
      closeFlow()
    } else {
      ;(homeOnExit
        ? chainRunCommands(
            maintenanceRunData?.data.id,
            [
              {
                commandType: 'home' as const,
                params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
              },
            ],
            true
          )
        : new Promise<void>((resolve, reject) => resolve())
      )
        .catch(error => {
          console.error(error.message)
        })
        .finally(() => deleteMaintenanceRun(maintenanceRunData?.data.id))
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
      isRobotMoving={isChainCommandMutationLoading || isExiting}
      handleCleanUpAndClose={handleCleanUpAndClose}
      chainRunCommands={chainRunCommands}
      createRunCommand={createMaintenanceCommand}
      errorDetails={errorDetails}
      setErrorDetails={setErrorDetails}
      isExiting={isExiting}
      deckConfig={deckConfig}
    />
  )
}

interface DropTipWizardComponentProps {
  robotType: RobotType
  mount: PipetteData['mount']
  createdMaintenanceRunId: string | null
  createMaintenanceRun: CreateMaintenanceRunType
  isRobotMoving: boolean
  isExiting: boolean
  setErrorDetails: (errorDetails: ErrorDetails) => void
  errorDetails: ErrorDetails | null
  handleCleanUpAndClose: (homeOnError?: boolean) => void
  chainRunCommands: ReturnType<
    typeof useChainMaintenanceCommands
  >['chainRunCommands']
  createRunCommand: ReturnType<
    typeof useCreateMaintenanceCommandMutation
  >['createMaintenanceCommand']
  instrumentModelSpecs: PipetteModelSpecs
  deckConfig: DeckConfiguration
  maintenanceRunId?: string
}

export const DropTipWizardComponent = (
  props: DropTipWizardComponentProps
): JSX.Element | null => {
  const {
    robotType,
    createMaintenanceRun,
    handleCleanUpAndClose,
    chainRunCommands,
    isRobotMoving,
    createRunCommand,
    setErrorDetails,
    errorDetails,
    isExiting,
    createdMaintenanceRunId,
    instrumentModelSpecs,
    deckConfig,
  } = props
  const { t, i18n } = useTranslation('drop_tip_wizard')
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const [shouldDispenseLiquid, setShouldDispenseLiquid] = React.useState<
    boolean | null
  >(null)
  const hasInitiatedExit = React.useRef(false)

  const isOnDevice = useSelector(getIsOnDevice)
  const setSpecificErrorDetails = useHandleDropTipCommandErrors(setErrorDetails)

  const DropTipWizardSteps = getDropTipWizardSteps(shouldDispenseLiquid)
  const currentStep =
    shouldDispenseLiquid != null
      ? getDropTipWizardSteps(shouldDispenseLiquid)[currentStepIndex]
      : null
  const isFinalStep = currentStepIndex === DropTipWizardSteps.length - 1

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const {
    button: errorExitBtn,
    subHeader: errorSubHeader,
  } = useDropTipErrorComponents({
    t,
    errorDetails,
    isOnDevice,
    chainRunCommands,
    maintenanceRunId: createdMaintenanceRunId,
    onClose: handleCleanUpAndClose,
  })

  React.useEffect(() => {
    if (createdMaintenanceRunId == null) {
      createMaintenanceRun({}).catch((e: Error) => {
        setSpecificErrorDetails({
          message: `Error creating maintenance run: ${e.message}`,
        })
      })
    }
  }, [])

  const goBack = (): void => {
    if (createdMaintenanceRunId != null) {
      setCurrentStepIndex(isFinalStep ? currentStepIndex : currentStepIndex - 1)
    }
  }

  const proceed = (): void => {
    if (isFinalStep) {
      handleCleanUpAndClose()
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handleJog: Jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    if (createdMaintenanceRunId != null) {
      createRunCommand({
        maintenanceRunId: createdMaintenanceRunId,
        command: {
          commandType: 'moveRelative',
          params: { pipetteId: MANAGED_PIPETTE_ID, distance: step * dir, axis },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT_MS,
      }).catch((e: Error) => {
        setSpecificErrorDetails({
          message: `Error issuing jog command: ${e.message}`,
        })
      })
    }
  }

  const moveToAddressableArea = (
    addressableArea: AddressableAreaName
  ): Promise<null> => {
    if (createdMaintenanceRunId == null) {
      return Promise.reject(
        new Error('no maintenance run present to send move commands to')
      )
    }

    const addressableAreaFromConfig = getAddressableAreaFromConfig(
      addressableArea,
      deckConfig,
      instrumentModelSpecs.channels,
      robotType
    )

    if (addressableAreaFromConfig != null) {
      return chainRunCommands(
        createdMaintenanceRunId,
        [
          {
            commandType: 'moveToAddressableArea',
            params: {
              pipetteId: MANAGED_PIPETTE_ID,
              stayAtHighestPossibleZ: true,
              addressableAreaName: addressableAreaFromConfig,
              offset: { x: 0, y: 0, z: 0 },
            },
          },
        ],
        true
      ).then(commandData => {
        const error = commandData[0].data.error
        if (error != null) {
          setSpecificErrorDetails({
            runCommandError: error,
            message: `Error moving to position: ${error.detail}`,
          })
        }
        return null
      })
    } else {
      setSpecificErrorDetails({
        message: `Error moving to position: invalid addressable area.`,
      })
      return Promise.resolve(null)
    }
  }

  const modalContent = buildModalContent()

  function buildModalContent(): JSX.Element {
    if (isRobotMoving) {
      return buildRobotInMotion()
    } else if (showConfirmExit) {
      return buildShowExitConfirmation()
    } else if (errorDetails != null) {
      return buildErrorScreen()
    } else if (shouldDispenseLiquid == null) {
      return buildBeforeBeginning()
    } else if (
      currentStep === CHOOSE_BLOWOUT_LOCATION ||
      currentStep === CHOOSE_DROP_TIP_LOCATION
    ) {
      return buildChooseLocation()
    } else if (
      currentStep === POSITION_AND_BLOWOUT ||
      currentStep === POSITION_AND_DROP_TIP
    ) {
      return buildJogToPosition()
    } else if (
      currentStep === BLOWOUT_SUCCESS ||
      currentStep === DROP_TIP_SUCCESS
    ) {
      return buildSuccess()
    } else {
      return <div>UNASSIGNED STEP</div>
    }

    function buildRobotInMotion(): JSX.Element {
      return <InProgressModal description={t('stand_back_exiting')} />
    }

    function buildShowExitConfirmation(): JSX.Element {
      return (
        <ExitConfirmation
          handleGoBack={cancelExit}
          handleExit={() => {
            hasInitiatedExit.current = true
            confirmExit()
          }}
        />
      )
    }

    function buildErrorScreen(): JSX.Element {
      return (
        <SimpleWizardBody
          isSuccess={false}
          iconColor={COLORS.red50}
          header={errorDetails?.header ?? t('error_dropping_tips')}
          subHeader={errorSubHeader}
          justifyContentForOddButton={JUSTIFY_FLEX_END}
        >
          {errorExitBtn}
        </SimpleWizardBody>
      )
    }

    function buildBeforeBeginning(): JSX.Element {
      return (
        <BeforeBeginning
          {...{
            setShouldDispenseLiquid,
            createdMaintenanceRunId,
            isOnDevice,
            isRobotMoving,
          }}
        />
      )
    }

    function buildChooseLocation(): JSX.Element {
      let bodyTextKey: string
      if (currentStep === CHOOSE_BLOWOUT_LOCATION) {
        bodyTextKey = isOnDevice
          ? 'select_blowout_slot_odd'
          : 'select_blowout_slot'
      } else {
        bodyTextKey = isOnDevice
          ? 'select_drop_tip_slot_odd'
          : 'select_drop_tip_slot'
      }
      return (
        <ChooseLocation
          robotType={robotType}
          handleProceed={proceed}
          handleGoBack={() => {
            setCurrentStepIndex(0)
            setShouldDispenseLiquid(null)
          }}
          title={
            currentStep === CHOOSE_BLOWOUT_LOCATION
              ? i18n.format(t('choose_blowout_location'), 'capitalize')
              : i18n.format(t('choose_drop_tip_location'), 'capitalize')
          }
          body={
            <Trans
              t={t}
              i18nKey={bodyTextKey}
              components={{ block: <StyledText as="p" /> }}
            />
          }
          moveToAddressableArea={moveToAddressableArea}
          isOnDevice={isOnDevice}
          setErrorDetails={setSpecificErrorDetails}
        />
      )
    }

    function buildJogToPosition(): JSX.Element {
      return (
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
                .then(commandData => {
                  const error = commandData[0].data.error
                  if (error != null) {
                    setSpecificErrorDetails({
                      runCommandError: error,
                      message: `Error moving to position: ${error.detail}`,
                    })
                  } else {
                    proceed()
                  }
                })
                .catch(e =>
                  setSpecificErrorDetails({
                    message: `Error issuing ${
                      currentStep === POSITION_AND_BLOWOUT
                        ? 'blowout'
                        : 'drop tip'
                    } command: ${e.message}`,
                  })
                )
            }
          }}
          handleGoBack={goBack}
          body={
            currentStep === POSITION_AND_BLOWOUT
              ? t('position_and_blowout')
              : t('position_and_drop_tip')
          }
          currentStep={currentStep as DropTipWizardStep}
          isOnDevice={isOnDevice}
        />
      )
    }

    function buildSuccess(): JSX.Element {
      return (
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
          isExiting={isExiting}
          isOnDevice={isOnDevice}
        />
      )
    }
  }

  const wizardHeaderOnExit = useWizardExitHeader({
    isFinalStep,
    hasInitiatedExit: hasInitiatedExit.current,
    errorDetails,
    confirmExit,
    handleCleanUpAndClose,
  })

  const wizardHeader = (
    <WizardHeader
      title={i18n.format(t('drop_tips'), 'capitalize')}
      currentStep={shouldDispenseLiquid != null ? currentStepIndex + 1 : null}
      totalSteps={DropTipWizardSteps.length}
      onExit={wizardHeaderOnExit}
    />
  )

  return createPortal(
    isOnDevice ? (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="992px"
        height="568px"
        left="14.5px"
        top="16px"
        border={BORDERS.lineBorder}
        boxShadow={BORDERS.shadowSmall}
        borderRadius={BORDERS.borderRadius16}
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
      >
        {wizardHeader}
        {modalContent}
      </Flex>
    ) : (
      <LegacyModalShell width="47rem" header={wizardHeader} overflow="hidden">
        {modalContent}
      </LegacyModalShell>
    ),
    getTopPortalEl()
  )
}
