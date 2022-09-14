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
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useAttachedPipettes,
} from '../../organisms/Devices/hooks'
import * as Config from '../../redux/config'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { Mount } from '@opentrons/components'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsTipLengthCalibrationProps {
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
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)
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

  const formatTipLengthCalibrations = (): FormattedTipLengthCalibration[] => {
    const tipLengths: FormattedTipLengthCalibration[] = []
    tipLengthCalibrations?.map(tipLength =>
      tipLengths.push({
        tiprack: tipLength.tiprack,
        pipette: tipLength.pipette,
        lastCalibrated: tipLength.lastModified,
        markedBad: tipLength.status.markedBad,
        uri: tipLength.uri,
      })
    )
    return tipLengths
  }

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
            formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
            formattedTipLengthCalibrations={formatTipLengthCalibrations()}
            updateRobotStatus={updateRobotStatus}
          />
        ) : (
          <StyledText as="label">{t('not_calibrated')}</StyledText>
        )}
      </Flex>
    </Box>
  )
}
