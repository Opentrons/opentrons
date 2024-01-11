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
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

import imgSrc from '../../assets/images/on-device-display/empty_protocol_dashboard.png'

export function NoProtocols(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.darkBlack20}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadiusSize3}
    >
      <img
        alt={t('nothing_here_yet')}
        src={imgSrc}
        width="284px"
        height="166px"
      />
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('nothing_here_yet')}
      </StyledText>
      <StyledText as="h4" color={COLORS.darkBlack70}>
        {t('send_a_protocol_to_store')}
      </StyledText>
    </Flex>
  )
}
