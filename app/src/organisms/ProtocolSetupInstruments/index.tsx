import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolInstrumentMountItem } from '../InstrumentMountItem'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import { isGripperInCommands } from '../../resources/protocols/utils'

export interface ProtocolSetupInstrumentsProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupInstruments({
  runId,
  setSetupScreen,
}: ProtocolSetupInstrumentsProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const { data: attachedInstruments, refetch } = useInstrumentsQuery()
  const {
    data: allPipettesCalibrationData,
  } = useAllPipetteOffsetCalibrationsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const usesGripper =
    mostRecentAnalysis != null
      ? isGripperInCommands(mostRecentAnalysis?.commands ?? [])
      : false
  const attachedGripperMatch = usesGripper
    ? (attachedInstruments?.data ?? []).find(
        (i): i is GripperData => i.instrumentType === 'gripper'
      ) ?? null
    : null

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing8}
    >
      <ODDBackButton
        label={t('instruments')}
        onClick={() => setSetupScreen('prepare to run')}
      />
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        paddingX={SPACING.spacing24}
      >
        <ColumnLabel>{t('location')}</ColumnLabel>
        <ColumnLabel>
          {i18n.format(t('calibration_status'), 'sentenceCase')}
        </ColumnLabel>
      </Flex>
      {(mostRecentAnalysis?.pipettes ?? []).map(loadedPipette => {
        const attachedPipetteMatch =
          (attachedInstruments?.data ?? []).find(
            (i): i is PipetteData =>
              i.instrumentType === 'pipette' &&
              i.ok &&
              i.mount === loadedPipette.mount &&
              i.instrumentName === loadedPipette.pipetteName
          ) ?? null
        return (
          <ProtocolInstrumentMountItem
            key={loadedPipette.mount}
            mount={loadedPipette.mount}
            speccedName={loadedPipette.pipetteName}
            attachedInstrument={attachedPipetteMatch}
            mostRecentAnalysis={mostRecentAnalysis}
            attachedCalibrationData={
              attachedPipetteMatch != null
                ? allPipettesCalibrationData?.data.find(
                    cal =>
                      cal.mount === attachedPipetteMatch.mount &&
                      cal.pipette === attachedPipetteMatch.instrumentName
                  ) ?? null
                : null
            }
            instrumentsRefetch={refetch}
          />
        )
      })}
      {usesGripper ? (
        <ProtocolInstrumentMountItem
          key="extension"
          mount="extension"
          speccedName={'gripperV1' as GripperModel}
          attachedInstrument={attachedGripperMatch}
          attachedCalibrationData={
            attachedGripperMatch?.data.calibratedOffset ?? null
          }
        />
      ) : null}
    </Flex>
  )
}

const ColumnLabel = styled.p`
  flex: 1;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.darkBlack70};
`
