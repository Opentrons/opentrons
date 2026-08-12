import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useLogPeriodSummariesQuery,
} from '@opentrons/react-api-client'

import { Skeleton } from '/app/atoms/Skeleton'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { ConfirmLogPeriodModal } from '../FileManagerWizardFlows/ConfirmLogPeriodModal'
import { DownloadDeleteLogPeriodWizard } from '../FileManagerWizardFlows/DownloadDeleteLogPeriodWizard'
import styles from './compliancereadyfiles.module.css'
import { LogPeriodRow } from './LogPeriodRow'

import type { ReactNode } from 'react'
import type { LogPeriodSummary } from '@opentrons/api-client'

export function ComplianceReadyFiles(): ReactNode {
  const { t } = useTranslation('device_details')
  const { data: logPeriodSummariesData, status: logPeriodSummaryQueryStatus } =
    useLogPeriodSummariesQuery()

  const logPeriodSummariesSorted = useMemo(() => {
    const logPeriodSummaries = logPeriodSummariesData?.data ?? []

    return [...logPeriodSummaries].sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
  }, [logPeriodSummariesData])

  const { data: protocolsData } = useAllProtocolsQuery()
  const { data: runsData } = useNotifyAllRunsQuery()

  // resolve protocol names once for the whole list
  const protocolNameByLogPeriodId = useMemo(() => {
    const protocols = protocolsData?.data ?? []
    const runs = runsData?.data ?? []

    const protocolNameById = protocols.reduce<Record<string, string>>(
      (acc, { id, metadata }) => {
        if (metadata?.protocolName != null) {
          acc[id] = metadata.protocolName
        }
        return acc
      },
      {}
    )

    return runs.reduce<Record<string, string>>((acc, run) => {
      const protocolName =
        run.protocolId != null ? protocolNameById[run.protocolId] : null
      if (run.logPeriodId != null && protocolName != null) {
        acc[run.logPeriodId] = protocolName
      }
      return acc
    }, {})
  }, [protocolsData, runsData])

  const [selectedLogPeriod, setSelectedLogPeriod] =
    useState<LogPeriodSummary | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [initialDeleteAfterDownload, setInitialDeleteAfterDownload] =
    useState(true)

  const handleOverflowClick = useCallback(
    (logPeriodSummary: LogPeriodSummary): void => {
      setSelectedLogPeriod(logPeriodSummary)
    },
    []
  )

  const handleCloseConfirmModal = (): void => {
    setSelectedLogPeriod(null)
  }

  const handleDownload = (): void => {
    setInitialDeleteAfterDownload(false)
    setShowWizard(true)
  }

  const handleDelete = (): void => {
    setInitialDeleteAfterDownload(true)
    setShowWizard(true)
  }

  const handleCloseWizard = (): void => {
    setShowWizard(false)
    setSelectedLogPeriod(null)
  }

  if (
    logPeriodSummaryQueryStatus !== 'loading' &&
    logPeriodSummariesData?.data.length === 0
  ) {
    return (
      <OddInfoScreen
        type="neutral"
        header={t('no_compliance_files')}
        height="100%"
      />
    )
  }

  // loading skeleton since log period summary query can take a noticible amount of time
  const skeletonContent = (
    <>
      <Skeleton width="100%" height="5.75rem" backgroundSize="59rem" />
      <Skeleton width="100%" height="5.75rem" backgroundSize="59rem" />
      <Skeleton width="100%" height="5.75rem" backgroundSize="59rem" />
    </>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText oddStyle="bodyTextSemiBold">{t('protocol')}</StyledText>
        <StyledText oddStyle="bodyTextSemiBold">{t('period_start')}</StyledText>
        <StyledText oddStyle="bodyTextSemiBold">{t('period_end')}</StyledText>
      </div>
      {logPeriodSummaryQueryStatus === 'loading'
        ? skeletonContent
        : logPeriodSummariesSorted.map(logPeriodSummary => (
            <LogPeriodRow
              key={logPeriodSummary.id}
              logPeriodSummary={logPeriodSummary}
              protocolName={protocolNameByLogPeriodId[logPeriodSummary.id]}
              handleOverflowClick={handleOverflowClick}
            />
          ))}
      {selectedLogPeriod != null ? (
        <ConfirmLogPeriodModal
          onClose={handleCloseConfirmModal}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      ) : null}
      {showWizard && selectedLogPeriod != null ? (
        <DownloadDeleteLogPeriodWizard
          logPeriod={selectedLogPeriod}
          initialDeleteAfterDownload={initialDeleteAfterDownload}
          onClose={handleCloseWizard}
        />
      ) : null}
    </div>
  )
}
