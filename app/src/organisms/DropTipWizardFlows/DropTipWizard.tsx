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
import {
  BLOWOUT_SUCCESS,
  BEFORE_BEGINNING,
  CHOOSE_DROP_TIP_LOCATION,
  CHOOSE_BLOWOUT_LOCATION,
  DROP_TIP_SUCCESS,
  POSITION_AND_BLOWOUT,
  POSITION_AND_DROP_TIP,
  DT_ROUTES,
  MANAGED_PIPETTE_ID,
} from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { ChooseLocation } from './ChooseLocation'
import { JogToPosition } from './JogToPosition'
import { Success } from './Success'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import {
  useDropTipCommandErrors,
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
import type { ErrorDetails, UseDropTipRoutingResult } from './utils'
import type { DropTipFlowsStep } from './types'
import type { DropTipWizardFlowsProps } from '.'

type DropTipWizardProps = DropTipWizardFlowsProps & {
  dropTipRoutingUtils: UseDropTipRoutingResult
}

export function DropTipWizard(props: DropTipWizardProps): JSX.Element {
  // TOME: Please clean this up!!!

  return (
    <DropTipWizardComponent
      dropTipRoutingUtils={props.dropTipRoutingUtils}
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
  dropTipRoutingUtils: UseDropTipRoutingResult
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
    dropTipRoutingUtils,
  } = props
  const { t, i18n } = useTranslation('drop_tip_wizard')
  const hasInitiatedExit = React.useRef(false)

  const isOnDevice = useSelector(getIsOnDevice)
  const setSpecificErrorDetails = useDropTipCommandErrors(setErrorDetails)

  const {
    currentStep,
    currentRoute,
    currentStepIdx,
    proceed,
    goBack,
    proceedToRoute,
  } = dropTipRoutingUtils

  const isFinalWizardStep = currentStep === DROP_TIP_SUCCESS // The happy path always ends with this step.

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

  // TOME: This probably needs work.
  const goBackRunValid = (): void => {
    if (createdMaintenanceRunId != null) {
      void goBack()
    }
  }

  const proceedWithConditionalClose = (): void => {
    if (isFinalWizardStep) {
      handleCleanUpAndClose()
    } else {
      void proceed()
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
    } else if (currentStep === BEFORE_BEGINNING) {
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
          proceedToRoute={proceedToRoute}
          isOnDevice={isOnDevice}
          createdMaintenanceRunId={createdMaintenanceRunId}
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
          handleProceed={proceedWithConditionalClose}
          handleGoBack={goBackRunValid}
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
          handleProceed={() => {}}
          handleGoBack={goBackRunValid}
          body={
            currentStep === POSITION_AND_BLOWOUT
              ? t('position_and_blowout')
              : t('position_and_drop_tip')
          }
          currentStep={currentStep as DropTipFlowsStep}
          isOnDevice={isOnDevice}
        />
      )
    }

    function buildSuccess(): JSX.Element {
      // Route to the drop tip route if user is at the blowout success screen, otherwise proceed conditionally.
      const handleProceed = (): void => {
        if (currentStep === BLOWOUT_SUCCESS) {
          void proceedToRoute(DT_ROUTES.DROP_TIP)
        } else {
          proceedWithConditionalClose()
        }
      }

      return (
        <Success
          message={
            currentStep === BLOWOUT_SUCCESS
              ? t('blowout_complete')
              : t('drop_tip_complete')
          }
          handleProceed={handleProceed}
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

  // TOME: This could be cleaned up, but I bet you'll do that through the presentation layer cleanup anyways.
  // Yeah...I'd do a useDTWizardHeader and have the lgoic there.
  const [hasSeenBlowoutSuccess, setHasSeenBlowoutSuccess] = React.useState(
    false
  )

  React.useEffect(() => {
    if (currentStep === BLOWOUT_SUCCESS) {
      setHasSeenBlowoutSuccess(true)
    }
  }, [currentStep])

  const wizardHeaderOnExit = useWizardExitHeader({
    isFinalStep: isFinalWizardStep,
    hasInitiatedExit: hasInitiatedExit.current,
    errorDetails,
    confirmExit,
    handleCleanUpAndClose,
  })

  // TOME: Refactor these out into their own build functions. This shold really be its own component file!
  const buildWizardHeader = (): JSX.Element => {
    const shouldRenderStepCounter = currentRoute !== DT_ROUTES.BEFORE_BEGINNING

    let totalSteps: null | number
    if (!shouldRenderStepCounter) {
      totalSteps = null
    } else if (currentRoute === DT_ROUTES.BLOWOUT || hasSeenBlowoutSuccess) {
      totalSteps = DT_ROUTES.BLOWOUT.length + DT_ROUTES.DROP_TIP.length
    } else {
      totalSteps = currentRoute.length
    }

    let currentStepNumber: null | number
    if (!shouldRenderStepCounter) {
      currentStepNumber = null
    } else if (hasSeenBlowoutSuccess && currentRoute === DT_ROUTES.DROP_TIP) {
      currentStepNumber = DT_ROUTES.BLOWOUT.length + currentStepIdx + 1
    } else {
      currentStepNumber = currentStepIdx + 1
    }

    return (
      <WizardHeader
        title={i18n.format(t('drop_tips'), 'capitalize')}
        currentStep={currentStepNumber}
        totalSteps={totalSteps}
        onExit={wizardHeaderOnExit}
      />
    )
  }

  // TOME: The portal layer needs to be above the rest of the presentation layer.
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
        {buildWizardHeader()}
        {modalContent}
      </Flex>
    ) : (
      <LegacyModalShell
        width="47rem"
        header={buildWizardHeader()}
        overflow="hidden"
      >
        {modalContent}
      </LegacyModalShell>
    ),
    getTopPortalEl()
  )
}
