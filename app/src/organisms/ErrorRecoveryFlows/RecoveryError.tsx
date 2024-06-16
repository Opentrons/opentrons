import * as React from 'react'
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
} from '@opentrons/components'

import { RECOVERY_MAP } from './constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from './shared'

import type { RecoveryContentProps } from './types'
import { SmallButton } from '../../atoms/buttons'

export function RecoveryError({
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
          >
            <StyledText as="h3Bold">
              {t('recovery_action_failed', { action: userRecoveryOptionCopy })}
            </StyledText>
            <StyledText as="h4">{t('return_to_the_menu')}</StyledText>
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_END}>
          <SmallButton
            onClick={onPrimaryClick}
            buttonText={t('back_to_menu')}
          />
        </Flex>
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
