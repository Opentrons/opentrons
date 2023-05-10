import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAllTipLengthCalibrationsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { useAttachedPipettes } from '../../organisms/Devices/hooks'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '.'
import { TipLengthCalibration } from '../../redux/calibration/api-types'
import { getDefaultTiprackDefForPipetteName } from '../Devices/constants'
import { getLabwareDefURI, PipetteName } from '@opentrons/shared-data'

interface RobotSettingsTipLengthCalibrationProps {
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export interface FormattedTipLengthCalibration {
  tiprack?: string
  pipette: string
  lastCalibrated?: string
  markedBad: boolean
  uri?: string | null
}

export function RobotSettingsTipLengthCalibration({
  formattedPipetteOffsetCalibrations,
  robotName,
  updateRobotStatus,
}: RobotSettingsTipLengthCalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const attachedPipettes = useAttachedPipettes()
  const tipLengthCalibrations = useAllTipLengthCalibrationsQuery().data?.data
  const tipLengthCalsForPipettesAndDefaultRacks: Array<
    Partial<Omit<TipLengthCalibration, 'pipette' | 'uri'>> &
      Pick<TipLengthCalibration, 'pipette' | 'uri'>
  > = []
  for (const pipette of Object.values(attachedPipettes)) {
    if (pipette != null) {
      const tiprackDef = getDefaultTiprackDefForPipetteName(
        pipette.name as PipetteName
      )
      if (tiprackDef != null) {
        const tiprackUri = getLabwareDefURI(tiprackDef)
        const foundTipLengthCal = tipLengthCalibrations?.find(
          cal => cal.pipette === pipette.id && cal.uri === tiprackUri
        )
        if (foundTipLengthCal != null) {
          tipLengthCalsForPipettesAndDefaultRacks.push(foundTipLengthCal)
        } else {
          tipLengthCalsForPipettesAndDefaultRacks.push({
            pipette: pipette.id,
            uri: tiprackUri,
          })
        }
      }
    }
  }
  const formattedTipLengthCalibrations: FormattedTipLengthCalibration[] =
    tipLengthCalsForPipettesAndDefaultRacks.length !== 0
      ? tipLengthCalsForPipettesAndDefaultRacks?.map(tipLength => ({
          tiprack: tipLength.tiprack,
          pipette: tipLength.pipette,
          lastCalibrated: tipLength.lastModified,
          markedBad: tipLength.status?.markedBad ?? false,
          uri: tipLength.uri,
        }))
      : []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing5}
      gridGap={SPACING.spacing3}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('tip_length_calibrations_title')}
      </StyledText>
      <TipLengthCalibrationItems
        robotName={robotName}
        formattedPipetteOffsetCalibrations={formattedPipetteOffsetCalibrations}
        formattedTipLengthCalibrations={formattedTipLengthCalibrations}
        updateRobotStatus={updateRobotStatus}
      />
    </Flex>
  )
}
