import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  StyledText,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_END,
  PrimaryButton,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { RecoverySingleColumnContentWrapper } from './shared'
import {
  DESKTOP_ONLY,
  ICON_SIZE_ALERT_INFO_STYLE,
  ODD_ONLY,
  RECOVERY_MAP,
} from './constants'

import type { RecoveryContentProps } from './types'

export function RecoveryError(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step } = recoveryMap
  const { ERROR_WHILE_RECOVERING } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED:
        return <ErrorRecoveryFlowError {...props} />
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR:
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return <RecoveryDropTipFlowErrors {...props} />
      default:
        return <ErrorRecoveryFlowError {...props} />
    }
  }

  return buildContent()
}

// Errors that occur within Error Recovery flows.
export function ErrorRecoveryFlowError({
  isOnDevice,
  getRecoveryOptionCopy,
  currentRecoveryOptionUtils,
  routeUpdateActions,
  recoveryCommands,
  errorKind,
}: RecoveryContentProps): JSX.Element {
  const { OPTION_SELECTION } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep, handleMotionRouting } = routeUpdateActions
  const { homePipetteZAxes } = recoveryCommands

  const userRecoveryOptionCopy = getRecoveryOptionCopy(
    selectedRecoveryOption,
    errorKind
  )

  const onPrimaryClick = (): void => {
    void handleMotionRouting(true)
      .then(() => homePipetteZAxes())
      .finally(() => handleMotionRouting(false))
      .then(() => proceedToRouteAndStep(OPTION_SELECTION.ROUTE))
  }

  return (
    <ErrorContent
      isOnDevice={isOnDevice}
      title={t('recovery_action_failed', { action: userRecoveryOptionCopy })}
      subTitle={t('next_try_another_action')}
      btnText={t('back_to_menu')}
      btnOnClick={onPrimaryClick}
    />
  )
}

export function RecoveryDropTipFlowErrors({
  recoveryMap,
  isOnDevice,
  currentRecoveryOptionUtils,
  routeUpdateActions,
  getRecoveryOptionCopy,
  errorKind,
}: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const { step } = recoveryMap
  const {
    ERROR_WHILE_RECOVERING,
    OPTION_SELECTION,
    DROP_TIP_FLOWS,
  } = RECOVERY_MAP
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep } = routeUpdateActions

  const userRecoveryOptionCopy = getRecoveryOptionCopy(
    selectedRecoveryOption,
    errorKind
  )

  const buildTitle = (): string => {
    switch (step) {
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR:
        return t('recovery_action_failed', { action: userRecoveryOptionCopy })
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return t('tip_drop_failed')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
        return t('blowout_failed')
      default:
        return t('recovery_action_failed', { action: selectedRecoveryOption })
    }
  }

  const buildSubTitle = (): string => {
    switch (step) {
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR:
        return t('next_try_another_action')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return t('next_try_another_action')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
        return t('you_can_still_drop_tips')
      default:
        return t('next_try_another_action')
    }
  }

  const buildBtnText = (): string => {
    switch (step) {
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR:
        return t('return_to_menu')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return t('return_to_menu')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
        return t('continue_to_drop_tip')
      default:
        return t('return_to_menu')
    }
  }

  const buildOnClick = (): (() => void) => {
    switch (step) {
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR:
        return () => proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return () => proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
        return () =>
          proceedToRouteAndStep(
            DROP_TIP_FLOWS.ROUTE,
            DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP
          )
      default:
        return () => proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
    }
  }

  return (
    <ErrorContent
      isOnDevice={isOnDevice}
      title={buildTitle()}
      subTitle={buildSubTitle()}
      btnText={buildBtnText()}
      btnOnClick={buildOnClick()}
    />
  )
}

export function ErrorContent({
  title,
  subTitle,
  btnText,
  btnOnClick,
}: {
  isOnDevice: boolean
  title: string
  subTitle: string
  btnText: string
  btnOnClick: () => void
}): JSX.Element | null {
  return (
    <RecoverySingleColumnContentWrapper>
      <Flex css={CONTAINER_STYLE}>
        <Icon
          name="alert-circle"
          color={COLORS.red50}
          data-testid="recovery_error_alert_icon"
          css={ICON_SIZE_ALERT_INFO_STYLE}
        />
        <Flex
          gridGap={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          textAlign={ALIGN_CENTER}
        >
          <StyledText
            oddStyle="level3HeaderBold"
            desktopStyle="headingSmallBold"
          >
            {title}
          </StyledText>
          <StyledText
            oddStyle="level4HeaderRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {subTitle}
          </StyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_END}>
        <SmallButton onClick={btnOnClick} buttonText={btnText} css={ODD_ONLY} />
        <PrimaryButton onClick={btnOnClick} css={DESKTOP_ONLY}>
          {btnText}
        </PrimaryButton>
      </Flex>
    </RecoverySingleColumnContentWrapper>
  )
}

const CONTAINER_STYLE = css`
  padding: ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing16};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  flex: 1;

  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    grid-gap: ${SPACING.spacing24};
  }
`
