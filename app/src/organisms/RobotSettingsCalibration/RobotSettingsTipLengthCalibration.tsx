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
  useRobot,
  useTipLengthCalibrations,
} from '../../organisms/Devices/hooks'
import * as Config from '../../redux/config'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsTipLengthCalibrationProps {
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export interface FormattedTipLengthCalibration {
  tiprack: string
  pipette: string
  lastCalibrated: string
  markedBad: boolean
  uri?: string | null
}

export function RobotSettingsTipLengthCalibration({
  formattedPipetteOffsetCalibrations,
  robotName,
  updateRobotStatus,
}: RobotSettingsTipLengthCalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])

  const robot = useRobot(robotName)
  const enableCalibrationWizards = Config.useFeatureFlag(
    'enableCalibrationWizards'
  )

  // wait for robot request to resolve instead of using name directly from params
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)

  const formattedTipLengthCalibrations: FormattedTipLengthCalibration[] =
    tipLengthCalibrations != null
      ? tipLengthCalibrations?.map(tipLength => ({
          tiprack: tipLength.tiprack,
          pipette: tipLength.pipette,
          lastCalibrated: tipLength.lastModified,
          markedBad: tipLength.status.markedBad,
          uri: tipLength.uri,
        }))
      : []

  return (
    <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Box marginRight={SPACING.spacing6}>
          <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
            {t('tip_length_calibrations_title')}
          </Box>
          <StyledText as="p" marginBottom={SPACING.spacing4}>
            {/* TODO(bh, 2022-09-07): remove legacy description when calibration wizard feature flag removed */}
            {enableCalibrationWizards
              ? t('tip_length_calibrations_description')
              : t('tip_length_calibrations_description_legacy')}
          </StyledText>
        </Box>
        {tipLengthCalibrations != null && tipLengthCalibrations.length !== 0 ? (
          <TipLengthCalibrationItems
            robotName={robotName}
            formattedPipetteOffsetCalibrations={
              formattedPipetteOffsetCalibrations
            }
            formattedTipLengthCalibrations={formattedTipLengthCalibrations}
            updateRobotStatus={updateRobotStatus}
          />
        ) : (
          <StyledText as="label">{t('not_calibrated')}</StyledText>
        )}
      </Flex>
    </Box>
  )
}
