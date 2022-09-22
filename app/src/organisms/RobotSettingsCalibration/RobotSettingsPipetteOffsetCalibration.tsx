import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import {
  usePipetteOffsetCalibrations,
  useRobot,
} from '../../organisms/Devices/hooks'
import * as Config from '../../redux/config'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsPipetteOffsetCalibrationProps {
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  pipetteOffsetCalBannerType: string
  robotName: string
  showPipetteOffsetCalibrationBanner: boolean
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function RobotSettingsPipetteOffsetCalibration({
  formattedPipetteOffsetCalibrations,
  pipetteOffsetCalBannerType,
  robotName,
  showPipetteOffsetCalibrationBanner,
  updateRobotStatus,
}: RobotSettingsPipetteOffsetCalibrationProps): JSX.Element {
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
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)

  return (
    <>
      {showPipetteOffsetCalibrationBanner && (
        <Banner
          type={pipetteOffsetCalBannerType === 'error' ? 'error' : 'warning'}
        >
          {pipetteOffsetCalBannerType === 'error'
            ? t('pipette_offset_calibration_missing')
            : t('pipette_offset_calibration_recommended')}
        </Banner>
      )}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {/* TODO(bh, 2022-09-07): remove legacy description when calibration wizard feature flag removed */}
              {enableCalibrationWizards
                ? t('pipette_offset_calibrations_description')
                : t('pipette_offset_calibrations_description_legacy')}
            </StyledText>
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
      </Box>
    </>
  )
}
