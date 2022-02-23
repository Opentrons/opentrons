import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { RobotSettingsCalibration } from '../../../organisms/Devices/RobotSettings/RobotSettingsCalibration'

import type {
  NextGenRouteParams,
  RobotSettingsTab,
} from '../../../App/NextGenApp'

export function RobotSettings(): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<NextGenRouteParams>()

  const robotSettingsContentByTab: {
    [K in RobotSettingsTab]: () => JSX.Element
  } = {
    calibration: () => <RobotSettingsCalibration robotName={robotName} />,
    // TODO: networking tab content
    networking: () => <div>networking</div>,
    // TODO: advanced tab content
    advanced: () => <div>advanced</div>,
  }

  const RobotSettingsContent = robotSettingsContentByTab[robotSettingsTab]

  interface NavTabProps {
    to: string
    tabName: string
  }

  const StyledNavLink = styled(NavLink)`
    color: ${COLORS.darkGreyEnabled};
    &.active {
      color: ${COLORS.darkBlack};
      ${BORDERS.tabBorder}
    }
  `

  function NavTab({ to, tabName }: NavTabProps): JSX.Element {
    return (
      <StyledNavLink to={to} replace>
        <Box
          css={TYPOGRAPHY.h6SemiBold}
          padding={`0 ${SPACING.spacing2} ${SPACING.spacing3} ${SPACING.spacing2}`}
        >
          {tabName}
        </Box>
      </StyledNavLink>
    )
  }

  return (
    <Box
      minWidth={SIZE_6}
      height="100%"
      overflow={OVERFLOW_SCROLL}
      padding={SPACING.spacing4}
    >
      <Flex
        backgroundColor={COLORS.white}
        border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGrey}`}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing4}
        width="100%"
      >
        <Box
          borderBottom={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGrey}`}
          padding={`0 ${SPACING.spacing4}`}
        >
          <Box
            color={COLORS.black}
            css={TYPOGRAPHY.h1Default}
            padding={`${SPACING.spacing5} 0`}
          >
            {t('robot_settings')}
          </Box>
          <Flex gridGap={SPACING.spacing4}>
            <NavTab
              to={`/devices/${robotName}/robot-settings/calibration`}
              tabName={t('calibration')}
            />
            <NavTab
              to={`/devices/${robotName}/robot-settings/networking`}
              tabName={t('networking')}
            />
            <NavTab
              to={`/devices/${robotName}/robot-settings/advanced`}
              tabName={t('advanced')}
            />
          </Flex>
        </Box>
        <Box padding={`${SPACING.spacing5} ${SPACING.spacing4}`}>
          <RobotSettingsContent />
        </Box>
      </Flex>
    </Box>
  )
}
