import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LegacyStyledText,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { BODY_TEXT_STYLE, ODD_SECTION_TITLE_STYLE } from './constants'
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
          <LegacyStyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
            {t('before_you_begin')}
          </LegacyStyledText>
          <Trans
            t={t}
            i18nKey={'error_recovery:recovery_mode_explanation'}
            components={{
              block: <LegacyStyledText as="p" css={BODY_TEXT_STYLE} />,
            }}
          />
          <SmallButton
            buttonType="primary"
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
