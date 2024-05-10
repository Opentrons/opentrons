import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

export function Loading(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing16}
    >
      <StyledText>{t('loading')}</StyledText>
      <Icon name="ot-spinner" size="2rem" spin />
    </Flex>
  )
}
