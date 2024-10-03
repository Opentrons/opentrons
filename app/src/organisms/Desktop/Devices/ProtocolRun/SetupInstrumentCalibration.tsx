import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import * as PipetteConstants from '/app/redux/pipettes/constants'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'
import { PipetteRecalibrationWarning } from '../PipetteCard/PipetteRecalibrationWarning'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useIsFlex } from '/app/redux-resources/robots'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'
import { SetupFlexPipetteCalibrationItem } from './SetupFlexPipetteCalibrationItem'
import { SetupGripperCalibrationItem } from './SetupGripperCalibrationItem'
import {
  useRunPipetteInfoByMount,
  useMostRecentCompletedAnalysis,
} from '/app/resources/runs'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { isGripperInCommands } from '/app/resources/protocols/utils'

import type { GripperData } from '@opentrons/api-client'
import { i18n } from '/app/i18n'

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
  const isFlex = useIsFlex(robotName)

  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    enabled: isFlex,
    refetchInterval: EQUIPMENT_POLL_MS,
  })
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const usesGripper = isGripperInCommands(
    mostRecentAnalysis?.commands ?? storedProtocolAnalysis?.commands ?? []
  )
  const attachedGripperMatch = usesGripper
    ? (instrumentsQueryData?.data ?? []).find(
        (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
      ) ?? null
    : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {getShowPipetteCalibrationWarning(instrumentsQueryData) && (
        <PipetteRecalibrationWarning />
      )}
      <LegacyStyledText
        color={COLORS.black90}
        css={TYPOGRAPHY.pSemiBold}
        id="PipetteCalibration_requiredPipettesTitle"
      >
        {i18n.format(t('required_instrument_calibrations'), 'titleCase')}
      </LegacyStyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        if (pipetteInfo != null && !isFlex) {
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
        } else if (isFlex) {
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
