import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Chip, SPACING } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { useApplyOffsets } from '/app/organisms/LabwarePositionCheck'
import {
  appliedOffsetsToRun,
  selectIsAnyNecessaryDefaultOffsetMissing,
} from '/app/redux/protocol-runs'
import { useUpdateClientLPC } from '/app/resources/client_data'

import styles from './setupoffsetsheader.module.css'

import type { ReactNode } from 'react'
import type { ProtocolSetupOffsetsProps } from '/app/organisms/ODD/ProtocolSetup'

export function SetupOffsetsHeader({
  runId,
  setSetupScreen,
  isConfirmed,
}: ProtocolSetupOffsetsProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const dispatch = useDispatch()
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const { updateWithRunId } = useUpdateClientLPC()
  const documentationState = useDocumentationState()

  const { applyOffsets, isApplyingOffsets } = useApplyOffsets(
    runId,
    documentationState
  )
  const onApplyOffsets = (): void => {
    void applyOffsets().then(() => {
      dispatch(appliedOffsetsToRun(runId))
      updateWithRunId(runId)
      setSetupScreen('prepare to run')
    })
  }

  return (
    <div className={styles.header_container}>
      <ODDBackButton
        label={t('labware_offsets')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      {isConfirmed ? (
        <Chip
          background
          iconName="ot-check"
          text={t('offsets_applied')}
          type="success"
        />
      ) : (
        <SmallButton
          buttonText={t('apply_offsets')}
          ariaDisabled={isNecessaryDefaultOffsetMissing}
          onClick={onApplyOffsets}
          buttonCategory="rounded"
          iconPlacement="startIcon"
          iconName={isApplyingOffsets ? 'ot-spinner' : null}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        />
      )}
    </div>
  )
}
