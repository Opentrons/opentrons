import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useIsFlex } from '/app/redux-resources/robots'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'

import { usePipetteOffsetCalibrations } from '../Devices/hooks'
import { PipetteRecalibrationWarning } from '../Devices/PipetteCard/PipetteRecalibrationWarning'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'

import type { ReactNode } from 'react'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsPipetteOffsetCalibrationProps {
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  isRobotBusy: boolean
}

export function RobotSettingsPipetteOffsetCalibration({
  formattedPipetteOffsetCalibrations,
  robotName,
  isRobotBusy,
}: RobotSettingsPipetteOffsetCalibrationProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const isFlex = useIsFlex(robotName)
  const { data: instrumentsData } = useInstrumentsQuery({
    enabled: isFlex,
  })
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const attachedPipettesFromInstrumentsQuery =
    useAttachedPipettesFromInstrumentsQuery()
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
  ) {
    showPipetteOffsetCalItems = true
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <LegacyStyledText
        forwardedAs="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {isFlex
          ? t('pipette_calibrations_title')
          : t('pipette_offset_calibrations_title')}
      </LegacyStyledText>
      {isFlex ? (
        <LegacyStyledText forwardedAs="p">
          {t('pipette_calibrations_description')}
        </LegacyStyledText>
      ) : null}
      {getShowPipetteCalibrationWarning(instrumentsData) && (
        <PipetteRecalibrationWarning />
      )}
      {showPipetteOffsetCalItems ? (
        <PipetteOffsetCalibrationItems
          robotName={robotName}
          isRobotBusy={isRobotBusy}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
        />
      ) : (
        <LegacyStyledText forwardedAs="label" marginTop={SPACING.spacing8}>
          {t('no_pipette_attached')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
