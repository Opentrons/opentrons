import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { PipetteRecalibrationWarning } from '/app/components/desktop/cards/PipetteCard/PipetteRecalibrationWarning'
import { i18n } from '/app/i18n'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { PIPETTE_MOUNTS } from '/app/resources/instruments/constants'
import { isGripperInCommands } from '/app/resources/protocols/utils'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'

import { SetupFlexPipetteCalibrationItem } from './SetupFlexPipetteCalibrationItem'
import { SetupGripperCalibrationItem } from './SetupGripperCalibrationItem'

import type { ReactNode } from 'react'
import type { GripperData } from '@opentrons/api-client'

const EQUIPMENT_POLL_MS = 5000

interface SetupInstrumentCalibrationProps {
  runId: string
}

export function SetupInstrumentCalibration({
  runId,
}: SetupInstrumentCalibrationProps): ReactNode {
  const { t } = useTranslation('protocol_setup')

  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const usesGripper = isGripperInCommands(
    mostRecentAnalysis?.commands ?? storedProtocolAnalysis?.commands ?? []
  )
  const attachedGripperMatch = usesGripper
    ? ((instrumentsQueryData?.data ?? []).find(
        (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
      ) ?? null)
    : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {getShowPipetteCalibrationWarning(instrumentsQueryData) && (
        <PipetteRecalibrationWarning />
      )}
      <LegacyStyledText color={COLORS.black90} css={TYPOGRAPHY.pSemiBold}>
        {i18n.format(t('required_instrument_calibrations'), 'titleCase')}
      </LegacyStyledText>
      {PIPETTE_MOUNTS.map((mount, index) => {
        return (
          <SetupFlexPipetteCalibrationItem
            key={index}
            mount={mount}
            runId={runId}
            instrumentsRefetch={refetch}
          />
        )
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
