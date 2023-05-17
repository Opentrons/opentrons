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
import { SetupInstrumentCalibrationItem } from './SetupPipetteCalibrationItem'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { GripperData } from '@opentrons/api-client'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { isGripperRequired } from '../../../resources/protocols/utils'

interface SetupInstrumentCalibrationProps {
  robotName: string
  runId: string
}

export function SetupInstrumentCalibration({
  robotName,
  runId,
}: SetupInstrumentCalibrationProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)

  const { data: instrumentsQueryData } = useInstrumentsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const usesGripper = mostRecentAnalysis != null ? isGripperRequired(mostRecentAnalysis) : false
  const attachedGripperMatch = usesGripper
    ? (instrumentsQueryData?.data ?? []).find(
      (i): i is GripperData => i.instrumentType === 'gripper'
    ) ?? null
    : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
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
            mount={mount}
            robotName={robotName}
            runId={runId}
          />
        ) : null
      })}
      {attachedGripperMatch != null ? (
          <SetupInstrumentCalibrationItem
            key='extension'
            pipetteInfo={pipetteInfo}
            mount={mount}
            robotName={robotName}
            runId={runId}
          />
      ) : null}
    </Flex>
  )
}
