import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useInterval,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import * as PipetteOffset from '../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../redux/pipettes'
import { useRunPipetteInfoByMount } from '../hooks'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'

import type { Dispatch } from '../../../redux/types'

const CALIBRATIONS_FETCH_MS = 5000
interface SetupPipetteCalibrationProps {
  robotName: string
  runId: string
}

export function SetupPipetteCalibration({
  robotName,
  runId,
}: SetupPipetteCalibrationProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const dispatch = useDispatch<Dispatch>()
  const runPipetteInfoByMount = useRunPipetteInfoByMount(robotName, runId)

  useInterval(
    () => {
      if (robotName != null) {
        dispatch(Pipettes.fetchPipettes(robotName))
        dispatch(PipetteOffset.fetchPipetteOffsetCalibrations(robotName))
      }
    },
    CALIBRATIONS_FETCH_MS,
    true
  )

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
