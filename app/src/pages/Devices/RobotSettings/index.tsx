import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useParams } from 'react-router-dom'

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

import { Line } from '../../../atoms/structure'
import { NavTab } from '../../../atoms/NavTab'
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

  const RobotSettingsContent =
    robotSettingsContentByTab[robotSettingsTab] ??
    // default to the calibration tab if no tab or nonexistent tab is passed as a param
    (() => <Redirect to={`/devices/${robotName}/robot-settings/calibration`} />)

  return (
    <Box
      minWidth={SIZE_6}
      height="100%"
      overflow={OVERFLOW_SCROLL}
      padding={SPACING.spacing4}
    >
      <Flex
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing4}
        width="100%"
      >
        <Box padding={`0 ${SPACING.spacing4}`}>
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
        <Line />
        <Box padding={`${SPACING.spacing5} ${SPACING.spacing4}`}>
          <RobotSettingsContent />
        </Box>
      </Flex>
    </Box>
  )
}
