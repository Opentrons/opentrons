import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { SecondaryButton } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useToaster } from '/app/organisms/ToasterOven'
import {
  ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
  useTrackEvent,
} from '/app/redux/analytics'
import { useStoredProtocolAnalysis } from '/app/resources/analysis/hooks/useStoredProtocolAnalysis'
import {
  EMPTY_TIMESTAMP,
  useQuickProtocolDetailsForRun,
  useRunCreatedAtTimestamp,
  useRunTimestamps,
} from '/app/resources/runs'
import { formatTimestamp } from '/app/transformations/runs'

import { isSupportedVersion } from '../../utils'
import { LabeledValue } from '../LabeledValue'
import styles from './runheadersectionlower.module.css'

import type { ReactNode } from 'react'
import type { RunHeaderContentProps } from '..'

// Note thd following minimum supported versions from Protocol Visualization PRD
const MIN_SUPPORTED_JSON_SCHEMA_VERSION = 6
const MIN_SUPPORTED_PYTHON_API_VERSION = [2, 14]

// The lower row of Protocol Run Header.
export function RunHeaderSectionLower({
  runId,
  runStatus,
  robotName,
  numberOfAtomicCommands,
}: RunHeaderContentProps): ReactNode {
  const { t } = useTranslation('run_details')
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()
  const { startedAt, completedAt } = useRunTimestamps(runId)
  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP
  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { protocolKey, robotType } = useQuickProtocolDetailsForRun(runId)
  const { makeSnackbar } = useToaster()

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const config = storedProtocolAnalysis?.config

  const isSupportedProtocol =
    config != null
      ? (config.protocolType === 'python' &&
          isSupportedVersion(
            config.apiVersion as [number, number],
            MIN_SUPPORTED_PYTHON_API_VERSION
          )) ||
        (config.protocolType === 'json' &&
          config.schemaVersion >= MIN_SUPPORTED_JSON_SCHEMA_VERSION)
      : true

  const handleVisualizeClick = (): void => {
    if (!isSupportedProtocol) {
      const snackbarText: string =
        config?.protocolType === 'python'
          ? t('out_of_date_protocol_python')
          : t('out_of_date_protocol_json')
      makeSnackbar(snackbarText)
      return
    }
    // need to encode URL to avoid spaces and slashes
    const encodedTimestamp = encodeURIComponent(createdAtTimestamp)
    const targetPath = `/devices/${robotName}/protocol-runs/${runId}/${encodedTimestamp}/${protocolKey}/visualization`
    trackEvent({
      name: ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
      properties: { sourceLocation: 'protocol run', numberOfAtomicCommands },
    })
    navigate(targetPath)
  }

  return (
    <div className={styles.section_container}>
      <div className={styles.time_container}>
        <LabeledValue label={t('protocol_start')} value={startedAtTimestamp} />
        <LabeledValue label={t('protocol_end')} value={completedAtTimestamp} />
      </div>
      {runStatus === RUN_STATUS_IDLE && robotType === FLEX_ROBOT_TYPE ? (
        <div className={styles.button_container}>
          <SecondaryButton onClick={handleVisualizeClick}>
            {t('visualize')}
          </SecondaryButton>
        </div>
      ) : null}
    </div>
  )
}
