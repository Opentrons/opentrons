import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
  StyledText,
  useConditionalConfirm,
} from '@opentrons/components'

import { LegacyModalShell } from '../../molecules/LegacyModal'
import { getTopPortalEl } from '../../App/portal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getIsOnDevice } from '../../redux/config'
import { ExitConfirmation } from './ExitConfirmation'
import {
  BEFORE_BEGINNING,
  BLOWOUT_SUCCESS,
  CHOOSE_BLOWOUT_LOCATION,
  CHOOSE_DROP_TIP_LOCATION,
  DROP_TIP_SUCCESS,
  DT_ROUTES,
  POSITION_AND_BLOWOUT,
  POSITION_AND_DROP_TIP,
} from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { ChooseLocation } from './ChooseLocation'
import { JogToPosition } from './JogToPosition'
import { Success } from './Success'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { useDropTipErrorComponents } from './hooks'
import { DropTipWizardHeader } from './DropTipWizardHeader'

import type { DropTipWizardFlowsProps } from '.'
import type { DropTipWizardContainerProps, IssuedCommandsType } from './types'
import type { UseDropTipRoutingResult, UseDropTipWithTypeResult } from './hooks'

export type DropTipWizardProps = DropTipWizardFlowsProps &
  UseDropTipWithTypeResult &
  UseDropTipRoutingResult & {
    issuedCommandsType: IssuedCommandsType
  }

export function DropTipWizard(props: DropTipWizardProps): JSX.Element {
  const {
    issuedCommandsType,
    activeMaintenanceRunId,
    proceed,
    goBack,
    currentStep,
    dropTipCommands,
    errorDetails,
  } = props

  const isFinalWizardStep = currentStep === DROP_TIP_SUCCESS // The happy path always ends with this step.

  const isOnDevice = useSelector(getIsOnDevice)
  const initiateExitUtils = useInitiateExit()
  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(dropTipCommands.handleCleanUpAndClose, true)

  const errorComponents = useDropTipErrorComponents({
    isOnDevice,
    errorDetails,
    handleMustHome: dropTipCommands.handleMustHome,
  })

  const goBackRunValid = (): Promise<void> => {
    if (activeMaintenanceRunId != null || issuedCommandsType === 'fixit') {
      return goBack()
    } else {
      return Promise.reject(new Error('No active maintenance run.'))
    }
  }

  // Either proceed to drop tip if blowout or execute the close flow routine, accounting for the commands type.
  const proceedWithConditionalClose = (): Promise<void> => {
    if (isFinalWizardStep) {
      return dropTipCommands.handleCleanUpAndClose()
    } else {
      return proceed()
    }
  }

  return (
    <DropTipWizardContainer
      {...props}
      {...initiateExitUtils}
      isOnDevice={isOnDevice}
      isFinalWizardStep={isFinalWizardStep}
      confirmExit={confirmExit}
      cancelExit={cancelExit}
      showConfirmExit={showConfirmExit}
      errorComponents={errorComponents}
      proceedWithConditionalClose={proceedWithConditionalClose}
      goBackRunValid={goBackRunValid}
    />
  )
}

// TODO(jh, 06-07-24): All content views could use refactoring and DQA. Create shared components from designs. EXEC-520.
export function DropTipWizardContainer(
  props: DropTipWizardContainerProps
): JSX.Element {
  const { issuedCommandsType } = props

  const buildDTWizType = (): JSX.Element => {
    if (issuedCommandsType === 'fixit') {
      return <DropTipWizardFixitType {...props} />
    } else {
      return <DropTipWizardSetupType {...props} />
    }
  }

  return buildDTWizType()
}

export function DropTipWizardFixitType(
  props: DropTipWizardContainerProps
): JSX.Element {
  return <DropTipWizardContent {...props} />
}

export function DropTipWizardSetupType(
  props: DropTipWizardContainerProps
): JSX.Element {
  const {
    activeMaintenanceRunId,
    isCommandInProgress,
    isExiting,
    showConfirmExit,
    errorDetails,
  } = props

  // TODO(jh: 06-10-24): This is not ideal. See EXEC-520.
  const inMotion =
    isCommandInProgress || isExiting || activeMaintenanceRunId == null
  const simpleWizardPaddingOverrides =
    inMotion || showConfirmExit || errorDetails

  return createPortal(
    props.isOnDevice ? (
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
        <DropTipWizardHeader {...props} />
        <Flex
          padding={simpleWizardPaddingOverrides ? 0 : SPACING.spacing32}
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          height="100%"
          flex="1"
        >
          <DropTipWizardContent {...props} />
        </Flex>
      </Flex>
    ) : (
      <LegacyModalShell
        width="47rem"
        header={<DropTipWizardHeader {...props} />}
        overflow="hidden"
      >
        <DropTipWizardContent {...props} />
      </LegacyModalShell>
    ),
    getTopPortalEl()
  )
}

export const DropTipWizardContent = (
  props: DropTipWizardContainerProps
): JSX.Element => {
  const {
    isOnDevice,
    activeMaintenanceRunId,
    currentStep,
    errorDetails,
    isCommandInProgress,
    fixitCommandTypeUtils,
    issuedCommandsType,
    isExiting,
    proceed,
    proceedToRoute,
    showConfirmExit,
    dropTipCommands,
    proceedWithConditionalClose,
    goBackRunValid,
    confirmExit,
    cancelExit,
    toggleExitInitiated,
    errorComponents,
  } = props

  const { t, i18n } = useTranslation('drop_tip_wizard')

  function buildGettingReady(): JSX.Element {
    return <InProgressModal description={t('getting_ready')} />
  }

  function buildRobotInMotion(): JSX.Element {
    return <InProgressModal description={t('stand_back_robot_in_motion')} />
  }

  function buildShowExitConfirmation(): JSX.Element {
    return (
      <ExitConfirmation
        {...props}
        handleGoBack={cancelExit}
        handleExit={() => {
          toggleExitInitiated()
          confirmExit()
        }}
      />
    )
  }

  function buildErrorScreen(): JSX.Element {
    const { button, subHeader } = errorComponents

    return (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={errorDetails?.header ?? t('error_dropping_tips')}
        subHeader={subHeader}
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        marginTop={`-${SPACING.spacing68}`} // See EXEC-520. This clearly isn't ideal.
      >
        {button}
      </SimpleWizardBody>
    )
  }

  function buildBeforeBeginning(): JSX.Element {
    return <BeforeBeginning {...props} />
  }

  function buildChooseLocation(): JSX.Element {
    const { moveToAddressableArea } = dropTipCommands

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
        {...props}
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
      />
    )
  }

  function buildJogToPosition(): JSX.Element {
    const { handleJog, blowoutOrDropTip } = dropTipCommands

    return (
      <JogToPosition
        {...props}
        handleJog={handleJog}
        handleProceed={() => blowoutOrDropTip(currentStep, proceed)}
        handleGoBack={goBackRunValid}
        body={
          currentStep === POSITION_AND_BLOWOUT
            ? t('position_and_blowout')
            : t('position_and_drop_tip')
        }
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

    const buildProceedText = (): string => {
      if (fixitCommandTypeUtils != null && currentStep === DROP_TIP_SUCCESS) {
        return fixitCommandTypeUtils.copyOverrides.tipDropCompleteBtnCopy
      } else {
        return currentStep === BLOWOUT_SUCCESS
          ? i18n.format(t('shared:continue'), 'capitalize')
          : i18n.format(t('shared:exit'), 'capitalize')
      }
    }

    return (
      <Success
        {...props}
        message={
          currentStep === BLOWOUT_SUCCESS
            ? t('blowout_complete')
            : t('drop_tip_complete')
        }
        handleProceed={handleProceed}
        proceedText={buildProceedText()}
      />
    )
  }

  function buildModalContent(): JSX.Element {
    // Don't render the spinner screen for 1 render cycle on fixit commands.
    if (currentStep === BEFORE_BEGINNING && issuedCommandsType === 'fixit') {
      return buildBeforeBeginning()
    } else if (
      activeMaintenanceRunId == null &&
      issuedCommandsType === 'setup'
    ) {
      return buildGettingReady()
    } else if (isCommandInProgress || isExiting) {
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
  }

  return buildModalContent()
}

// Controls closing drop tip flow. Because DT flows may be closed from multiple components and,
// emit actions to the server, ensure flows may be closed only once.
function useInitiateExit(): {
  isExitInitiated: boolean
  toggleExitInitiated: () => void
} {
  const [isExitInitiated, setIsExitInitiated] = React.useState(false)

  const toggleExitInitiated = (): void => {
    setIsExitInitiated(true)
  }

  return { isExitInitiated, toggleExitInitiated }
}
