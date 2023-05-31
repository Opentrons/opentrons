import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

interface ConnectingNetworkProps {
  ssid: string
}
export function ConnectingNetwork({
  ssid,
}: ConnectingNetworkProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        height="33rem"
        backgroundColor={COLORS.darkBlack20}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.size3}
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
            color={COLORS.darkBlack70}
            aria-label="spinner"
            spin
          />
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('connecting_to', { ssid: ssid })}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
