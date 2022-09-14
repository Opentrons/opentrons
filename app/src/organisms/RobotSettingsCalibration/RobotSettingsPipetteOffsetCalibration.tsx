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
  useAttachedPipettes,
} from '../../organisms/Devices/hooks'
import * as Config from '../../redux/config'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'

import type { Mount } from '@opentrons/components'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsPipetteOffsetCalibrationProps {
  pipetteOffsetCalBannerType: string
  robotName: string
  showPipetteOffsetCalibrationBanner: boolean
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function RobotSettingsPipetteOffsetCalibration({
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
  const attachedPipettes = useAttachedPipettes()

  const formatPipetteOffsetCalibrations = (): FormattedPipetteOffsetCalibration[] => {
    const pippets = []
    if (attachedPipettes != null) {
      pippets.push({
        modelName: attachedPipettes.left?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.left?.id,
        mount: 'left' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.status.markedBad,
      })
      pippets.push({
        modelName: attachedPipettes.right?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.right?.id,
        mount: 'right' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.status.markedBad,
      })
    }
    return pippets
  }

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
              formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
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
