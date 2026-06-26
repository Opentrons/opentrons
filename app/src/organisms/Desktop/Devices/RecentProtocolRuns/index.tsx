import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BasicButton, InfoScreen, StyledText } from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useCurrentRunId,
  useNotifyAllRunsQuery,
  useRunStatuses,
} from '/app/resources/runs'

import { DeleteRecordsModal } from '../DeleteRecordsModal'
import { HistoricalProtocolRun } from './HistoricalProtocolRun'
import styles from './recentprotocolruns.module.css'

interface RecentProtocolRunsProps {
  robotName: string
}

export function RecentProtocolRuns({
  robotName,
}: RecentProtocolRunsProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const isRobotViewable = useIsRobotViewable(robotName)
  const runsQueryResponse = useNotifyAllRunsQuery()
  const runs = runsQueryResponse?.data?.data
  const protocols = useAllProtocolsQuery()
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()
  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)

  // TODO: wire up delete runs handler
  const handleConfirmDeleteRuns = (): void => {
    setShowDeleteRecordsModal(false)
  }

  const robotIsBusy = currentRunId != null ? !isRunTerminal : false

  // TODO (nd, 06/25/2026): audit this once full run delete endpoint is created
  const allRunsMutable = [...(runs ?? [])]

  return (
    <>
      {showDeleteRecordsModal ? (
        <DeleteRecordsModal
          type="allRuns"
          onClose={() => {
            setShowDeleteRecordsModal(false)
          }}
          onConfirm={handleConfirmDeleteRuns}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.header}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('run_history')}
          </StyledText>
          <div className={styles.header_actions}>
            <BasicButton
              // TODO: wire up actions for downloading all
              onClick={() => {
                setShowDeleteRecordsModal(true)
              }}
              iconName="download"
            >
              {t('download_all')}
            </BasicButton>
            <BasicButton
              onClick={() => {
                setShowDeleteRecordsModal(true)
              }}
            >
              {t('delete_all')}
            </BasicButton>
          </div>
        </div>
        <div className={styles.content}>
          {isRobotViewable && allRunsMutable && allRunsMutable?.length > 0 && (
            <>
              <div className={styles.column_headers}>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_RunTitle"
                >
                  {t('run_date')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_ProtocolTitle"
                >
                  {t('protocol')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_StatusTitle"
                >
                  {t('status')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_FilesTitle"
                >
                  {t('files')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  data-testid="RecentProtocolRuns_DurationTitle"
                >
                  {t('run_duration')}
                </StyledText>
              </div>
              <div className={styles.runs_list}>
                {allRunsMutable
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((run, index) => {
                    const protocol = protocols?.data?.data.find(
                      protocol => protocol.id === run.protocolId
                    )
                    const protocolName =
                      protocol?.metadata.protocolName ??
                      protocol?.files[0].name ??
                      t('shared:loading') ??
                      ''

                    return (
                      <HistoricalProtocolRun
                        run={run}
                        protocolName={protocolName}
                        protocolKey={protocol?.key}
                        robotName={robotName}
                        robotIsBusy={robotIsBusy}
                        key={index}
                      />
                    )
                  })}
              </div>
            </>
          )}
          {!isRobotViewable && (
            <InfoScreen content={t('offline_recent_protocol_runs')} />
          )}
          {isRobotViewable && allRunsMutable?.length === 0 && (
            <InfoScreen content={t('no_protocol_runs')} />
          )}
        </div>
      </div>
    </>
  )
}
