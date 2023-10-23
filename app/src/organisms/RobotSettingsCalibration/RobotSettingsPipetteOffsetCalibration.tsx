import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import {
  useAttachedPipettesFromInstrumentsQuery,
  useIsFlex,
  usePipetteOffsetCalibrations,
} from '../Devices/hooks'
import { getShowPipetteCalibrationWarning } from '../Devices/utils'
import { PipetteRecalibrationWarning } from '../Devices/PipetteCard/PipetteRecalibrationWarning'
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

  const isFlex = useIsFlex(robotName)
  const { data: instrumentsData } = useInstrumentsQuery({
    enabled: isFlex,
  })
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const attachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery()
  const ot3AttachedLeftPipetteOffsetCal =
    attachedPipettesFromInstrumentsQuery.left?.data?.calibratedOffset ?? null
  const ot3AttachedRightPipetteOffsetCal =
    attachedPipettesFromInstrumentsQuery.right?.data?.calibratedOffset ?? null

  let showPipetteOffsetCalItems = false
  if (!isFlex && pipetteOffsetCalibrations != null) {
    showPipetteOffsetCalItems = true
  } else if (
    isFlex &&
    (ot3AttachedLeftPipetteOffsetCal != null ||
      ot3AttachedRightPipetteOffsetCal != null)
  )
    showPipetteOffsetCalItems = true

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {isFlex
          ? t('pipette_calibrations_title')
          : t('pipette_offset_calibrations_title')}
      </StyledText>
      {isFlex ? (
        <StyledText as="p">{t('pipette_calibrations_description')}</StyledText>
      ) : null}
      {getShowPipetteCalibrationWarning(instrumentsData) && (
        <PipetteRecalibrationWarning />
      )}
      {showPipetteOffsetCalItems ? (
        <PipetteOffsetCalibrationItems
          robotName={robotName}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
          updateRobotStatus={updateRobotStatus}
        />
      ) : (
        <StyledText as="label" marginTop={SPACING.spacing8}>
          {t('no_pipette_attached')}
        </StyledText>
      )}
    </Flex>
  )
}
