import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export function ServerInitializing(): ReactNode {
  const { t } = useTranslation('device_details')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
      gridGap={SPACING.spacing32}
    >
      <Icon name="ot-spinner" spin size="6rem" color={COLORS.grey60} />
      <LegacyStyledText
        forwardedAs="h4"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={COLORS.grey60}
      >
        {t('robot_initializing')}
      </LegacyStyledText>
    </Flex>
  )
}
