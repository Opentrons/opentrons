import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import imgSrc from '../../assets/images/on-device-display/empty_quick_transfer_dashboard.png'

export function NoQuickTransfers(): JSX.Element {
  const { t } = useTranslation('quick_transfer')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
    >
      <img alt={t('none_to_show')} src={imgSrc} width="284px" height="166px" />
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('none_to_show')}
      </StyledText>
      <StyledText as="h4" color={COLORS.grey60}>
        {t('create_to_get_started')}
      </StyledText>
    </Flex>
  )
}
