import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import {
  useIsOT3,
  usePipetteOffsetCalibrations,
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
  const { t } = useTranslation('device_settings')

  const isOT3 = useIsOT3(robotName)

  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing5}
      gridGap={SPACING.spacing3}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {isOT3
          ? t('pipette_calibrations_title')
          : t('pipette_offset_calibrations_title')}
      </StyledText>
      {isOT3 ? (
        <StyledText as="p">{t('pipette_calibrations_description')}</StyledText>
      ) : null}
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
