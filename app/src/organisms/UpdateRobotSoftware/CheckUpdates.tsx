import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function CheckUpdates(): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      backgroundColor={COLORS.darkGreyDisabled}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacingXXL}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
    >
      <Icon
        name="ot-spinner"
        size="4.375rem"
        spin
        color={COLORS.darkGreyEnabled}
      />
      <StyledText
        fontSize="2rem"
        lineHeight="2.75rem"
        fontWeight="700"
        colors={COLORS.black}
      >
        {t('checking_for_updates')}
      </StyledText>
    </Flex>
  )
}
