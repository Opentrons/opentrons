import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function DisplaySearchNetwork(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  return (
    <Flex
      height="17.5rem"
      backgroundColor={COLORS.white}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      data-testid="Display-Search-Network-text"
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
      >
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacingXXL}
        >
          {t('searching_for_networks')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
