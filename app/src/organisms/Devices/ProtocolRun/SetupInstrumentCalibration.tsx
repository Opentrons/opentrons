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
import { useRunPipetteInfoByMount, useStoredProtocolAnalysis } from '../hooks'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'
import { SetupGripperCalibrationItem } from './SetupGripperCalibrationItem'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { isGripperInCommands } from '../../../resources/protocols/utils'

import type { GripperData } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

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

  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const usesGripper = isGripperInCommands(
    mostRecentAnalysis?.commands ?? storedProtocolAnalysis?.commands ?? []
  )
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
        {i18n.format(t('required_instrument_calibrations'), 'titleCase')}
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
            instrumentsRefetch={refetch}
          />
        ) : null
      })}
      {usesGripper ? (
        <SetupGripperCalibrationItem
          gripperData={attachedGripperMatch}
          runId={runId}
        />
      ) : null}
    </Flex>
  )
}
