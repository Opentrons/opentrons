import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  StyledText,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_END,
} from '@opentrons/components'

import { RECOVERY_MAP } from './constants'
import { RecoverySingleColumnContent } from './shared'

import type { RecoveryContentProps } from './types'
import { SmallButton } from '../../atoms/buttons'

export function RecoveryError(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props
  const { step } = recoveryMap
  const { ERROR_WHILE_RECOVERING } = RECOVERY_MAP

  const buildContent = (): JSX.Element | null => {
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
}: RecoveryContentProps): JSX.Element | null {
  const { OPTION_SELECTION } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep } = routeUpdateActions

  const userRecoveryOptionCopy = getRecoveryOptionCopy(selectedRecoveryOption)

  const onPrimaryClick = (): void => {
    void proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
  }

  return (
    <ErrorContent
      isOnDevice={isOnDevice}
      title={t('recovery_action_failed', { action: userRecoveryOptionCopy })}
      subTitle={t('return_to_the_menu')}
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
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { step } = recoveryMap
  const {
    ERROR_WHILE_RECOVERING,
    OPTION_SELECTION,
    DROP_TIP_FLOWS,
  } = RECOVERY_MAP
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep } = routeUpdateActions

  const userRecoveryOptionCopy = getRecoveryOptionCopy(selectedRecoveryOption)

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
        return t('return_to_the_menu')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED:
        return t('return_to_the_menu')
      case ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED:
        return t('you_can_still_drop_tips')
      default:
        return t('return_to_the_menu')
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
  isOnDevice,
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
  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <Flex
          padding={SPACING.spacing40}
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={ALIGN_CENTER}
          flex="1"
        >
          <Icon
            name="alert-circle"
            size={SPACING.spacing60}
            color={COLORS.red50}
            data-testid="recovery_error_alert_icon"
          />
          <Flex
            gridGap={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            textAlign={ALIGN_CENTER}
          >
            <StyledText as="h3Bold">{title}</StyledText>
            <StyledText as="h4">{subTitle}</StyledText>
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_END}>
          <SmallButton onClick={btnOnClick} buttonText={btnText} />
        </Flex>
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
