import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import {
  useIsOT3,
  usePipetteOffsetCalibrations,
  useRobot,
} from '../../organisms/Devices/hooks'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsPipetteOffsetCalibrationProps {
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function RobotSettingsPipetteOffsetCalibration({
  formattedPipetteOffsetCalibrations,
  robotName,
  updateRobotStatus,
}: RobotSettingsPipetteOffsetCalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])

  const robot = useRobot(robotName)
  const isOT3 = useIsOT3(robotName)

  // wait for robot request to resolve instead of using name directly from params
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)

  return (
    <Flex paddingY={SPACING.spacing5} flexDirection={DIRECTION_COLUMN}>
      <Box marginRight={SPACING.spacing6}>
        <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
          {isOT3
            ? t('pipette_calibrations_title')
            : t('pipette_offset_calibrations_title')}
        </Box>
        {isOT3
          ? <StyledText as="p" marginBottom={SPACING.spacing4}>t('pipette_calibrations_description')</StyledText>
          : null}
      </Box>
      {pipetteOffsetCalibrations != null ? (
        <PipetteOffsetCalibrationItems
          robotName={robotName}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
          updateRobotStatus={updateRobotStatus}
        />
      ) : (
        <StyledText as="label">{t('not_calibrated')}</StyledText>
      )}
    </Flex>
  )
}
