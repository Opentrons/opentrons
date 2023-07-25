import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTION_ROW, Flex, SPACING, TYPOGRAPHY } from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'

export function EstopBanner(): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <Banner type="error" width="100%">
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing2}>
        <StyledText as="p">{t('estop_pressed')}</StyledText>
        <StyledText textDecoration={TYPOGRAPHY.textDecorationUnderline}>
          {t('reset_estop')}
        </StyledText>
      </Flex>
    </Banner>
  )
}
