import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import abstractImage from '../../../assets/images/OnDeviceDisplay/Illustration@x2.png'

export function EmptyRecentRun(): JSX.Element {
  const { t } = useTranslation('device_details')
  return (
    <Flex
      width="100%"
      height="27.25rem"
      backgroundColor={`${COLORS.darkBlackEnabled}${COLORS.opacity15HexCode}`}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      padding="5.25rem 3.75rem"
    >
      <Flex marginBottom={SPACING.spacing4}>
        <img
          src={abstractImage}
          alt="RobotDashboard no recent run protocols"
          width="284px"
          height="166px"
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        alignItems={ALIGN_CENTER}
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSize32}
          lineHeight={TYPOGRAPHY.lineHeight42}
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
        >
          {t('no_recent_runs')}
        </StyledText>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack_seventy}
        >
          {t('no_recent_runs_description')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
