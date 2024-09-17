import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
  useConditionalConfirm,
  ModalShell,
  DISPLAY_FLEX,
  OVERFLOW_HIDDEN,
} from '@opentrons/components'

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
import { InProgressModal } from '../../molecules/InProgressModal'
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

// TODO(jh, 06-07-24): All content views could use refactoring and DQA. Create shared components from designs.
// Convince design not to use SimpleWizardBody. EXEC-520.
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
  return (
    <Flex css={INTERVENTION_CONTAINER_STYLE}>
      <DropTipWizardContent {...props} />
    </Flex>
  )
}

export function DropTipWizardSetupType(
  props: DropTipWizardContainerProps
): JSX.Element {
  return createPortal(
    props.isOnDevice ? (
      <Flex css={SIMPLE_CONTAINER_STYLE}>
        <DropTipWizardHeader {...props} />
        <Flex css={SIMPLE_CONTENT_CONTAINER_STYLE}>
          <DropTipWizardContent {...props} />
        </Flex>
      </Flex>
    ) : (
      <ModalShell
        css={SIMPLE_CONTAINER_STYLE}
        header={<DropTipWizardHeader {...props} />}
      >
        <Flex css={SIMPLE_CONTENT_CONTAINER_STYLE}>
          <DropTipWizardContent {...props} />
        </Flex>
      </ModalShell>
    ),
    getTopPortalEl()
  )
}

export const DropTipWizardContent = (
  props: DropTipWizardContainerProps
): JSX.Element => {
  const {
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
    return <ExitConfirmation {...props} />
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
        css={INTERVENTION_ERROR_MODAL_STYLE}
      >
        {button}
      </SimpleWizardBody>
    )
  }

  function buildBeforeBeginning(): JSX.Element {
    return <BeforeBeginning {...props} />
  }

  function buildChooseLocation(): JSX.Element {
    return <ChooseLocation {...props} />
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
    const { tipDropComplete } = fixitCommandTypeUtils?.buttonOverrides ?? {}

    // Route to the drop tip route if user is at the blowout success screen, otherwise proceed conditionally.
    const handleProceed = (): void => {
      if (currentStep === BLOWOUT_SUCCESS) {
        void proceedToRoute(DT_ROUTES.DROP_TIP)
      } else {
        // Clear the error recovery submap upon completion of drop tip wizard.
        fixitCommandTypeUtils?.reportMap(null)

        if (tipDropComplete != null) {
          tipDropComplete()
        } else {
          proceedWithConditionalClose()
        }
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

const INTERVENTION_ERROR_MODAL_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    margin-top: -${SPACING.spacing68}; // See EXEC-520. This clearly isn't ideal.
  }
`

const INTERVENTION_CONTAINER_STYLE = css`
  padding: ${SPACING.spacing32};
  grid-gap: ${SPACING.spacing24};
  height: 100%;
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing32};
  }
`

const SIMPLE_CONTAINER_STYLE = css`
  width: 47rem;
  min-height: 26.75rem;
  overflow: ${OVERFLOW_HIDDEN};
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};

  // TODO(jh 09-17-24): This is effectively making a ModalShell analogue on the ODD, since one does not exist.
  //  Consider making one.
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    position: ${POSITION_ABSOLUTE};
    width: 62rem;
    height: 35.5rem;
    left: 16px;
    top: 16px;
    border: ${BORDERS.lineBorder};
    box-shadow: ${BORDERS.shadowSmall};
    border-radius: ${BORDERS.borderRadius16};
    background-color: ${COLORS.white};
  }
`

const SIMPLE_CONTENT_CONTAINER_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  width: 100%;
  height: 100%;
  padding: ${SPACING.spacing32};
  flex: 1;
`
