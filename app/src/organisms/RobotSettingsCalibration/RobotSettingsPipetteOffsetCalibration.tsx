import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { INCONSISTENT_PIPETTE_OFFSET } from '@opentrons/api-client'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import {
  useAttachedPipettesFromInstrumentsQuery,
  useIsOT3,
  usePipetteOffsetCalibrations,
} from '../Devices/hooks'
import { PipetteRecalibrationWarning } from '../Devices/PipetteCard/PipetteRecalibrationWarning'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'

import type { PipetteData } from '@opentrons/api-client'
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
  const { data: instrumentsData } = useInstrumentsQuery({
    enabled: isOT3,
  })
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations()
  const attachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery()
  const ot3AttachedLeftPipetteOffsetCal =
    attachedPipettesFromInstrumentsQuery.left?.data?.calibratedOffset ?? null
  const ot3AttachedRightPipetteOffsetCal =
    attachedPipettesFromInstrumentsQuery.right?.data?.calibratedOffset ?? null

  let showPipetteOffsetCalItems = false
  if (!isOT3 && pipetteOffsetCalibrations != null) {
    showPipetteOffsetCalItems = true
  } else if (
    isOT3 &&
    (ot3AttachedLeftPipetteOffsetCal != null ||
      ot3AttachedRightPipetteOffsetCal != null)
  )
    showPipetteOffsetCalItems = true
  const pipetteCalibrationWarning =
    instrumentsData?.data.some((i): i is PipetteData => {
      const failuresList =
        i.ok && i.data.calibratedOffset?.reasonability_check_failures != null
          ? i.data.calibratedOffset?.reasonability_check_failures
          : []
      if (failuresList.length > 0) {
        return failuresList[0]?.kind === INCONSISTENT_PIPETTE_OFFSET
      } else return false
    }) ?? false

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {isOT3
          ? t('pipette_calibrations_title')
          : t('pipette_offset_calibrations_title')}
      </StyledText>
      {isOT3 ? (
        <StyledText as="p">{t('pipette_calibrations_description')}</StyledText>
      ) : null}
      {pipetteCalibrationWarning && <PipetteRecalibrationWarning />}
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
