import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { SecondaryButton } from '@opentrons/components'

import { useFeatureFlag } from '/app/redux/config'
import {
  EMPTY_TIMESTAMP,
  useProtocolDetailsForRun,
  useRunCreatedAtTimestamp,
  useRunTimestamps,
} from '/app/resources/runs'
import { formatTimestamp } from '/app/transformations/runs'

import { LabeledValue } from '../LabeledValue'
import styles from './runheadersectionlower.module.css'

import type { RunHeaderContentProps } from '..'

// The lower row of Protocol Run Header.
export function RunHeaderSectionLower({
  runId,
  runStatus,
  robotName,
}: RunHeaderContentProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const enableProtocolTimeline = useFeatureFlag('protocolTimeline')
  const navigate = useNavigate()
  const { startedAt, completedAt } = useRunTimestamps(runId)

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP
  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { protocolKey } = useProtocolDetailsForRun(runId)

  const handleVisualizeClick = (): void => {
    // need to encode URL to avoid spaces and slashes
    const encodedTimestamp = encodeURIComponent(createdAtTimestamp)
    const targetPath = `/devices/${robotName}/${runId}/${encodedTimestamp}/${protocolKey}/visualization`
    navigate(targetPath)
  }

  return (
    <div className={styles.section_container}>
      <div className={styles.time_container}>
        <LabeledValue label={t('protocol_start')} value={startedAtTimestamp} />
        <LabeledValue label={t('protocol_end')} value={completedAtTimestamp} />
      </div>
      {enableProtocolTimeline && runStatus === RUN_STATUS_IDLE ? (
        <div className={styles.button_container}>
          <SecondaryButton onClick={handleVisualizeClick}>
            {t('visualize')}
          </SecondaryButton>
        </div>
      ) : null}
    </div>
  )
}
