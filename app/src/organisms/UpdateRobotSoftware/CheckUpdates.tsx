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
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function CheckUpdates(): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      backgroundColor={COLORS.darkBlack20}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="32.5rem"
      borderRadius={BORDERS.size3}
    >
      <Icon name="ot-spinner" size="5rem" spin color={COLORS.darkGreyEnabled} />
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {t('checking_for_updates')}
      </StyledText>
    </Flex>
  )
}
