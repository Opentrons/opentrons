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
  const { t } = useTranslation('device_settings')

  const robot = useRobot(robotName)

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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing5}
      gridGap={SPACING.spacing3}>
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('tip_length_calibrations_title')}
      </StyledText>
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
  )
}
