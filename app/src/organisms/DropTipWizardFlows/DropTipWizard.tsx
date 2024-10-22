import { useState } from 'react'
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
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
  useConditionalConfirm,
  ModalShell,
  DISPLAY_FLEX,
  OVERFLOW_HIDDEN,
  OVERFLOW_AUTO,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { getIsOnDevice } from '/app/redux/config'
import { ExitConfirmation } from './ExitConfirmation'
import {
  BEFORE_BEGINNING,
  BLOWOUT_SUCCESS,
  CHOOSE_BLOWOUT_LOCATION,
  CHOOSE_DROP_TIP_LOCATION,
  CHOOSE_LOCATION_OPTION,
  CONFIRM_POSITION,
  DROP_TIP_SUCCESS,
  DT_ROUTES,
  POSITION_AND_BLOWOUT,
  POSITION_AND_DROP_TIP,
} from './constants'
import {
  BeforeBeginning,
  ChooseLocation,
  ChooseDeckLocation,
  JogToPosition,
  Success,
  ConfirmPosition,
  useConfirmPosition,
} from './steps'
import { InProgressModal } from '/app/molecules/InProgressModal'
import { useDropTipErrorComponents } from './hooks'
import { DropTipWizardHeader } from './DropTipWizardHeader'
import { ErrorInfo } from './ErrorInfo'

import type { DropTipWizardFlowsProps } from '.'
import type { DropTipWizardContainerProps, IssuedCommandsType } from './types'
import type {
  UseDropTipRoutingResult,
  UseDropTipWithTypeResult,
  DropTipBlowoutLocationDetails,
} from './hooks'

export type DropTipWizardProps = DropTipWizardFlowsProps &
  UseDropTipWithTypeResult &
  UseDropTipRoutingResult & {
    issuedCommandsType: IssuedCommandsType
    dropTipCommandLocations: DropTipBlowoutLocationDetails[]
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
    currentRoute,
    errorDetails,
    isCommandInProgress,
    issuedCommandsType,
    isExiting,
    showConfirmExit,
  } = props

  const { t } = useTranslation('drop_tip_wizard')
  const confirmPositionUtils = useConfirmPosition(currentStep)

  function buildGettingReady(): JSX.Element {
    return <InProgressModal description={t('getting_ready')} />
  }

  function buildRobotInMotion(): JSX.Element {
    return <InProgressModal description={t('stand_back_robot_in_motion')} />
  }

  function buildRobotPipetteMoving(): JSX.Element {
    return (
      <InProgressModal
        description={
          currentRoute === DT_ROUTES.BLOWOUT
            ? t('stand_back_blowing_out')
            : t('stand_back_dropping_tips')
        }
      />
    )
  }

  function buildShowExitConfirmation(): JSX.Element {
    return <ExitConfirmation {...props} />
  }

  function buildErrorScreen(): JSX.Element {
    return <ErrorInfo {...props} />
  }

  function buildBeforeBeginning(): JSX.Element {
    return <BeforeBeginning {...props} />
  }

  function buildChooseLocation(): JSX.Element {
    return <ChooseLocation {...props} {...confirmPositionUtils} />
  }

  function buildChooseDeckLocation(): JSX.Element {
    return <ChooseDeckLocation {...props} />
  }

  function buildJogToPosition(): JSX.Element {
    return <JogToPosition {...props} {...confirmPositionUtils} />
  }

  function buildConfirmPosition(): JSX.Element {
    return <ConfirmPosition {...props} {...confirmPositionUtils} />
  }

  function buildSuccess(): JSX.Element {
    return <Success {...props} />
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
    } else if (confirmPositionUtils.isRobotPipetteMoving) {
      return buildRobotPipetteMoving()
    } else if (isCommandInProgress || isExiting) {
      return buildRobotInMotion()
    } else if (showConfirmExit) {
      return buildShowExitConfirmation()
    } else if (errorDetails != null) {
      return buildErrorScreen()
    } else if (currentStep === BEFORE_BEGINNING) {
      return buildBeforeBeginning()
    } else if (currentStep === CHOOSE_LOCATION_OPTION) {
      return buildChooseLocation()
    } else if (
      currentStep === CHOOSE_BLOWOUT_LOCATION ||
      currentStep === CHOOSE_DROP_TIP_LOCATION
    ) {
      return buildChooseDeckLocation()
    } else if (
      currentStep === POSITION_AND_BLOWOUT ||
      currentStep === POSITION_AND_DROP_TIP
    ) {
      return buildJogToPosition()
    } else if (currentStep === CONFIRM_POSITION) {
      return buildConfirmPosition()
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
  const [isExitInitiated, setIsExitInitiated] = useState(false)

  const toggleExitInitiated = (): void => {
    setIsExitInitiated(true)
  }

  return { isExitInitiated, toggleExitInitiated }
}

const SHARED_STYLE = `
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  overflow-y: ${OVERFLOW_AUTO};
  
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    overflow: ${OVERFLOW_HIDDEN};
  }
`

const INTERVENTION_CONTAINER_STYLE = css`
  ${SHARED_STYLE}
  padding: ${SPACING.spacing32};
  grid-gap: ${SPACING.spacing24};
  height: 100%;
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing32};
  }
`

const SIMPLE_CONTAINER_STYLE = css`
  ${SHARED_STYLE}
  width: 47rem;
  min-height: 26.75rem;

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
  grid-gap: ${SPACING.spacing24};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing32};
  }
`
