// @flow
import * as React from 'react'
import {
  Icon,
  Box,
  Flex,
  Text,
  FONT_SIZE_BODY_1,
  COLOR_WARNING,
  COLOR_ERROR,
  SPACING_AUTO,
  SPACING_1,
  ALIGN_CENTER,
} from '@opentrons/components'

import styles from './styles.css'
import type { ViewableRobot } from '../../discovery/types'

const ROBOT_CAL_WARNING = "This robot's deck has not yet been calibrated."
const ROBOT_CAL_RESOLUTION =
  'Please perform a deck calibration prior to uploading a protocol.'
const ROBOT_CAL_ERROR =
  'Bad deck calibraiton detected! This robot is likely to experience a crash.'

export function DeckCalibrationWarning(props: ViewableRobot): React.Node {
  const { robot } = props
  const { health } = robot
  const isVisible = health && health.calibration !== 'OK'
  const isDefaultCalibration = health && health.calibration === 'IDENTITY'
  const message = isDefaultCalibration ? ROBOT_CAL_WARNING : ROBOT_CAL_ERROR
  const colorType = isDefaultCalibration ? COLOR_WARNING : COLOR_ERROR

  if (!isVisible) return null

  return (
    <Flex alignItems={ALIGN_CENTER}>
      <Icon
        name={'alert-circle'}
        color={colorType}
        className={styles.cal_check_error_icon}
      />
      <Box fontSize={FONT_SIZE_BODY_1} paddingRight={SPACING_1}>
        <Text color={colorType} marginRight={SPACING_AUTO}>
          {message}
        </Text>
        <Text color={colorType} marginRight={SPACING_AUTO}>
          {ROBOT_CAL_RESOLUTION}
        </Text>
      </Box>
    </Flex>
  )
}
