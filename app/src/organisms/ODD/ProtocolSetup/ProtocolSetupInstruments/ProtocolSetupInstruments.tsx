import { useTranslation } from 'react-i18next'

import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { ProtocolInstrumentMountItem } from '/app/organisms/ODD/InstrumentMountItem'
import { PipetteRecalibrationODDWarning } from '/app/organisms/ODD/PipetteRecalibrationODDWarning'
import { isGripperInCommands } from '/app/resources/protocols/utils'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'

import styles from './protocolsetupinstruments.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { SetupScreens } from '../types'

export interface ProtocolSetupInstrumentsProps {
  runId: string
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

export function ProtocolSetupInstruments({
  runId,
  setSetupScreen,
}: ProtocolSetupInstrumentsProps): ReactNode {
  const { t, i18n } = useTranslation('protocol_setup')
  const { data: attachedInstruments, refetch } = useInstrumentsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const usesGripper =
    mostRecentAnalysis != null
      ? isGripperInCommands(mostRecentAnalysis?.commands ?? [])
      : false
  const attachedGripperMatch = usesGripper
    ? ((attachedInstruments?.data ?? []).find(
        (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
      ) ?? null)
    : null

  return (
    <div className={styles.instruments_container}>
      <div className={styles.back_button_container}>
        <ODDBackButton
          label={t('instruments')}
          onClick={() => {
            setSetupScreen('prepare to run')
          }}
        />
      </div>
      {getShowPipetteCalibrationWarning(attachedInstruments) && (
        <div className={styles.warning_container}>
          <PipetteRecalibrationODDWarning />
        </div>
      )}
      <div className={styles.header_container}>
        <p className={styles.column_label}>{t('location')}</p>
        <p className={styles.column_label}>
          {i18n.format(t('calibration_status'), 'sentenceCase')}
        </p>
      </div>
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
            instrumentsRefetch={refetch}
            pipetteInfo={mostRecentAnalysis?.pipettes}
          />
        )
      })}
      {usesGripper ? (
        <ProtocolInstrumentMountItem
          key="extension"
          mount="extension"
          speccedName={'gripperV1' as GripperModel}
          attachedInstrument={attachedGripperMatch}
        />
      ) : null}
    </div>
  )
}
