import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import {
  NON_SANCTIONED_RECOVERY_COLOR_STYLE_PRIMARY,
  BODY_TEXT_STYLE,
  ODD_SECTION_TITLE_STYLE,
} from './constants'
import { RecoverySingleColumnContent } from './shared'

import type { RecoveryContentProps } from './types'

export function BeforeBeginning({
  isOnDevice,
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedNextStep } = routeUpdateActions

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <Flex flexDirection={DIRECTION_COLUMN} height="100%">
          <StyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
            {t('before_you_begin')}
          </StyledText>
          <Trans
            t={t}
            i18nKey={'error_recovery:recovery_mode_explanation'}
            components={{ block: <StyledText as="p" css={BODY_TEXT_STYLE} /> }}
          />
          <SmallButton
            buttonType="primary"
            css={NON_SANCTIONED_RECOVERY_COLOR_STYLE_PRIMARY}
            buttonText={t('view_recovery_options')}
            justifyContent={JUSTIFY_CENTER}
            onClick={proceedNextStep}
            marginTop="auto"
          />
        </Flex>
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
