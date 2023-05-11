import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import abstractImage from '../../../assets/images/on-device-display/empty_recent_protocol_run.png'

export function EmptyRecentRun(): JSX.Element {
  const { t } = useTranslation('device_details')
  return (
    <Flex
      width="100%"
      height="27.25rem"
      backgroundColor={`${COLORS.darkBlackEnabled}${COLORS.opacity15HexCode}`}
      borderRadius={BORDERS.size_three}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      padding="5.25rem 3.75rem"
    >
      <Flex marginBottom={SPACING.spacing16}>
        <img
          src={abstractImage}
          alt="There is no recent run protocol"
          width="284px"
          height="166px"
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSize32}
          lineHeight={TYPOGRAPHY.lineHeight42}
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {t('no_recent_runs')}
        </StyledText>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack70}
        >
          {t('no_recent_runs_description')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
