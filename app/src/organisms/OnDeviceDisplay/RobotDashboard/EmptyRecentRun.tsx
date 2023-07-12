import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  COLORS,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import abstractImage from '../../../assets/images/on-device-display/empty_protocol_dashboard.png'

export function EmptyRecentRun(): JSX.Element {
  const { t } = useTranslation('device_details')
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
        src={abstractImage}
        alt={t('no_recent_runs')}
        width="284px"
        height="166px"
      />
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('no_recent_runs')}
      </StyledText>
      <StyledText
        as="h4"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={COLORS.darkBlack70}
      >
        {t('no_recent_runs_description')}
      </StyledText>
    </Flex>
  )
}
