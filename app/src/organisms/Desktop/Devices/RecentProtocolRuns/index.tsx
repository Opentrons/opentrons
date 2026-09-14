import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  BasicButton,
  ERROR_TOAST,
  INFO_TOAST,
  InfoScreen,
  StyledText,
  SUCCESS_TOAST,
  WARNING_TOAST,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useDeleteSelectedRuns,
  useDownloadSelectedRuns,
} from '/app/resources/devices'
import {
  useCurrentRunId,
  useNotifyAllRunsQuery,
  useRunStatuses,
} from '/app/resources/runs'

import { DeleteRecordsModal } from '../DeleteRecordsModal'
import { HistoricalProtocolRun } from './HistoricalProtocolRun'
import styles from './recentprotocolruns.module.css'

import type { IconProps } from '@opentrons/components'

interface RecentProtocolRunsProps {
  robotName: string
}

export function RecentProtocolRuns({
  robotName,
}: RecentProtocolRunsProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const isRobotViewable = useIsRobotViewable(robotName)
  const runsQueryResponse = useNotifyAllRunsQuery()
  const runs = runsQueryResponse?.data?.data ?? []
  const protocols = useAllProtocolsQuery()
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()
  const { makeToast, eatToast } = useToaster()
  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)
  const documentationState = useDocumentationState()
  const {
    mutateAsync: downloadSelectedRuns,
    status: downloadSelectedRunsStatus,
  } = useDownloadSelectedRuns(robotName)
  const { deleteSelectedRuns, deletingIds } =
    useDeleteSelectedRuns(documentationState)

  const handleNoRuns = (type: 'delete' | 'download'): void => {
    makeToast(t(`no_recent_runs_to_${type}`) as string, WARNING_TOAST, {
      closeButton: true,
    })
  }

  const handleDownloadSelected = (): void => {
    if (runs.length === 0) {
      handleNoRuns('download')
      return
    }
    if (downloadSelectedRunsStatus !== 'loading') {
      const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
      const toastId = makeToast(
        t('device_details:downloading_run_records') as string,
        INFO_TOAST,
        { icon: toastIcon, disableTimeout: true }
      )
      void downloadSelectedRuns({ runs })
        .then(() => {
          makeToast(t('files_successfully_downloaded') as string, SUCCESS_TOAST)
        })
        .catch((e: Error) => {
          makeToast(e.message, ERROR_TOAST, { closeButton: true })
        })
        .finally(() => {
          eatToast(toastId)
        })
    }
  }

  const handleClickDeleteAll = (): void => {
    if (runs.length === 0) {
      handleNoRuns('delete')
      return
    }
    setShowDeleteRecordsModal(true)
  }

  const handleConfirmDeleteAll = (): void => {
    void deleteSelectedRuns(runs).catch(() => {
      makeToast('Error deleting records', ERROR_TOAST)
    })
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
          onConfirm={handleConfirmDeleteAll}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.header}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('run_history')}
          </StyledText>
          <div className={styles.header_actions}>
            <BasicButton onClick={handleDownloadSelected} iconName="download">
              {t('download_all')}
            </BasicButton>
            <BasicButton onClick={handleClickDeleteAll}>
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
                  .map(run => {
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
                        isDeleting={deletingIds.has(run.id)}
                        key={run.id}
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
