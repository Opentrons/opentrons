import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { INCONSISTENT_PIPETTE_OFFSET } from '@opentrons/api-client'
import { StyledText } from '../../../atoms/text'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { PipetteRecalibrationWarning } from '../PipetteCard/PipetteRecalibrationWarning'
import {
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
  useIsOT3,
} from '../hooks'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'
import { SetupFlexPipetteCalibrationItem } from './SetupFlexPipetteCalibrationItem'
import { SetupGripperCalibrationItem } from './SetupGripperCalibrationItem'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { isGripperInCommands } from '../../../resources/protocols/utils'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

const EQUIPMENT_POLL_MS = 5000

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
  const isOT3 = useIsOT3(robotName)

  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    enabled: isOT3,
    refetchInterval: EQUIPMENT_POLL_MS,
  })
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
  const pipetteCalibrationWarning =
    instrumentsQueryData?.data.some((i): i is PipetteData => {
      const failuresList =
        i.ok && i.data.calibratedOffset?.reasonability_check_failures != null
          ? i.data.calibratedOffset?.reasonability_check_failures
          : []
      if (failuresList.length > 0) {
        return failuresList[0]?.kind === INCONSISTENT_PIPETTE_OFFSET
      } else return false
    }) ?? false

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {pipetteCalibrationWarning && <PipetteRecalibrationWarning />}
      <StyledText
        color={COLORS.black}
        css={TYPOGRAPHY.pSemiBold}
        id="PipetteCalibration_requiredPipettesTitle"
      >
        {i18n.format(t('required_instrument_calibrations'), 'titleCase')}
      </StyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        if (pipetteInfo != null && !isOT3) {
          return (
            <SetupPipetteCalibrationItem
              key={index}
              pipetteInfo={pipetteInfo}
              mount={mount}
              robotName={robotName}
              runId={runId}
              instrumentsRefetch={refetch}
            />
          )
        } else if (isOT3) {
          return (
            <SetupFlexPipetteCalibrationItem
              key={index}
              mount={mount}
              runId={runId}
              instrumentsRefetch={refetch}
            />
          )
        } else {
          return null
        }
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
