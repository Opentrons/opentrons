import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { useRunPipetteInfoByMount } from '../hooks'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'

import { useAllPipetteOffsetCalibrationsQuery, usePipettesQuery } from '@opentrons/react-api-client'

const PIPETTE_POLL_FETCH_MS = 5000
interface SetupPipetteCalibrationProps {
  robotName: string
  runId: string
}

export function SetupPipetteCalibration({
  robotName,
  runId,
}: SetupPipetteCalibrationProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const runPipetteInfoByMount = useRunPipetteInfoByMount(robotName, runId)

  usePipettesQuery({refetchInterval: PIPETTE_POLL_FETCH_MS})
  useAllPipetteOffsetCalibrationsQuery({refetchInterval: PIPETTE_POLL_FETCH_MS})

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
      <StyledText
        color={COLORS.black}
        css={TYPOGRAPHY.pSemiBold}
        id="PipetteCalibration_requiredPipettesTitle"
      >
        {t('required_pipettes_title')}
      </StyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        return pipetteInfo != null ? (
          <SetupPipetteCalibrationItem
            key={index}
            pipetteInfo={pipetteInfo}
            index={index}
            mount={mount}
            robotName={robotName}
            runId={runId}
          />
        ) : null
      })}
    </Flex>
  )
}
