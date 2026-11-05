import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export function DisplaySearchNetwork(): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])
  return (
    <Flex
      height="17.5rem"
      backgroundColor={COLORS.white}
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
      width="100%"
      data-testid="Display-Search-Network-text"
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
      >
        <LegacyStyledText
          forwardedAs="h3"
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing40}
        >
          {t('searching_for_networks')}
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
