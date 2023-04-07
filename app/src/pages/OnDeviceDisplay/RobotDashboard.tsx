import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'

import abstractImage from '../../assets/images/odd/abstract@x2.png'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8 // This might be changed

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
    >
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize20}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {t('run_again')}
        </StyledText>
        {/* <Flex
        width="100%"
        height="14.375rem"
        backgroundColor={COLORS.fundamentalsBackground}
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing4)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacing6)}`}
        alignItems={ALIGN_CENTER}
      >
        <img
          src={abstractImage}
          alt="Robot Dashboard no protocol run data"
          width="864px"
          height="108px"
        />
        <StyledText
          fontSize="1.5rem"
          lineHeight="2.25rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('have_not_run')}
        </StyledText>
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.875rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.black}
        >
          {t('have_not_run_description')}
        </StyledText>
      </Flex> */}
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing3}>
          <RecentRunCard />
          <RecentRunCard />
        </Flex>
      </Flex>
    </Flex>
  )
}

interface RecentRunCardProps {
  moduleStatus: string // also need to pass the module status type
  protocolName: string // need to change
  lastRun: string
}

function RecentRunCard(): JSX.Element {
  // function LastRunCard({ moduleStatus, protocolName, lastRun }): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing5}
      gridGap={SPACING.spacing5}
      backgroundColor={COLORS.green_three}
      width="25.8125rem"
      borderRadius={BORDERS.size_four}
    >
      {/* marginLeft is needed to cancel chip's padding */}
      <Flex marginLeft={`-${SPACING.spacing4}`}>
        <Chip type="success" background={false} text={'Ready to run'} />
      </Flex>
      <Flex width="100%" height="14rem">
        <StyledText
          fontSize={TYPOGRAPHY.fontSize32}
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
          lineHeight={TYPOGRAPHY.lineHeight42}
        >
          {'Covid-19 qPCR Prep (Station C)'}
        </StyledText>
      </Flex>
      <StyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        color={COLORS.darkBlack_seventy}
      >
        {'Last run 1 min ago'}
      </StyledText>
    </Flex>
  )
}
