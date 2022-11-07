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
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function SearchNetwork(): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <>
      <Flex
        height="26.5625rem"
        backgroundColor="#D6D6D6"
        justifyContent={JUSTIFY_CENTER}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name="ot-spinner"
            size="5.125rem"
            color={COLORS.darkGreyEnabled}
            aria-label="spinner"
            spin
          />
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {t('searching_for_network')}
          </StyledText>
        </Flex>
      </Flex>
    </>
  )
}
