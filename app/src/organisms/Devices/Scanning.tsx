import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Icon,
  Text,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_CENTER,
  SIZE_2,
  SPACING_5,
} from '@opentrons/components'

export function Scanning(): JSX.Element {
  const { t } = useTranslation('devices_landing')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      padding={`${SPACING_5} 0`}
    >
      <Text as="h3" fontWeight={FONT_WEIGHT_REGULAR} paddingBottom="0.625rem">
        {t('looking_for_robots')}
      </Text>
      <Icon name="ot-spinner" size={SIZE_2} spin />
    </Flex>
  )
}
