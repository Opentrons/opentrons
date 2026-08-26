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

interface ConnectingNetworkProps {
  ssid: string
}
export function ConnectingNetwork({ ssid }: ConnectingNetworkProps): ReactNode {
  const { t } = useTranslation('device_settings')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} flex="1" height="100%">
      <Flex
        backgroundColor={COLORS.grey35}
        flex="1"
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
        >
          <Icon
            name="ot-spinner"
            size="5rem"
            color={COLORS.grey60}
            aria-label="spinner"
            spin
          />
          <LegacyStyledText
            forwardedAs="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
          >
            {t('connecting_to', { ssid: ssid })}
          </LegacyStyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
