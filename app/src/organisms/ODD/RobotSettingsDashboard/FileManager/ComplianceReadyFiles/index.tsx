import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  ListItem,
  OverflowBtn,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import { useLogPeriodSummariesQuery } from '@opentrons/react-api-client'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { formatTimestamp } from '/app/transformations/runs'

import { ConfirmLogPeriodModal } from '../FileManagerWizardFlows/ConfirmLogPeriodModal'
import { DownloadDeleteLogPeriodWizard } from '../FileManagerWizardFlows/DownloadDeleteLogPeriodWizard'
import styles from './compliancereadyfiles.module.css'

import type { ReactNode } from 'react'
import type { LogPeriodSummary } from '@opentrons/api-client'

export function ComplianceReadyFiles(): ReactNode {
  const { t } = useTranslation('device_details')
  const { data } = useLogPeriodSummariesQuery()
  const { data: logPeriodSummaries } = data ?? { data: [] }

  const logPeriodSummariesMutable = [...logPeriodSummaries]
  const logPeriodSummariesSorted = logPeriodSummariesMutable.sort((a, b) => {
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })

  const [selectedLogPeriod, setSelectedLogPeriod] =
    useState<LogPeriodSummary | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [initialDeleteAfterDownload, setInitialDeleteAfterDownload] =
    useState(true)

  const handleOverflowClick = (logPeriodSummary: LogPeriodSummary): void => {
    setSelectedLogPeriod(logPeriodSummary)
  }

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

  if (logPeriodSummariesSorted.length === 0) {
    return (
      <OddInfoScreen
        type="neutral"
        header={t('no_compliance_files')}
        height="100%"
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText oddStyle="bodyTextSemiBold">{t('file_type')}</StyledText>
        <StyledText oddStyle="bodyTextSemiBold">{t('period_start')}</StyledText>
        <StyledText oddStyle="bodyTextSemiBold">{t('period_end')}</StyledText>
      </div>
      {logPeriodSummariesSorted.map(logPeriodSummary => {
        return (
          <ListItem
            key={logPeriodSummary.id}
            type="default"
            padding={SPACING.spacing24}
            className={styles.record_container}
          >
            <div className={styles.record_content}>
              <StyledText
                oddStyle="bodyTextSemiBold"
                className={styles.protocol_name}
              >
                {t('user_action_logs')}
              </StyledText>
              <Tag
                type="default"
                text={formatTimestamp(logPeriodSummary.startedAt)}
                shrinkToContent
              />
              <Tag
                type="default"
                text={
                  logPeriodSummary.endedAt != null
                    ? formatTimestamp(logPeriodSummary.endedAt)
                    : t('in_progress')
                }
                shrinkToContent
              />
            </div>
            <OverflowBtn
              justifySelf={ALIGN_FLEX_END}
              onClick={() => {
                handleOverflowClick(logPeriodSummary)
              }}
            />
          </ListItem>
        )
      })}
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
