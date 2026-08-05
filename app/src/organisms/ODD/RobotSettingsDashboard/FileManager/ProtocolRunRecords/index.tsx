import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  Chip,
  COLORS,
  FLEX_MIN_CONTENT,
  ListItem,
  OverflowBtn,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { useNotifyAllRunsQuery } from '/app/resources/runs'
import { formatTimestamp } from '/app/transformations/runs'

import { ConfirmRunRecordModal } from '../FileManagerWizardFlows/ConfirmRunRecordModal'
import { DownloadDeleteRunRecordWizard } from '../FileManagerWizardFlows/DownloadDeleteRunRecordWizard'
import styles from './protocolrunrecords.module.css'

import type { ReactNode } from 'react'
import type { RunData, RunStatus } from '@opentrons/api-client'
import type { ChipType, ListItemType } from '@opentrons/components'

export function ProtocolRunRecords(): ReactNode {
  const { data } = useNotifyAllRunsQuery()
  const { i18n, t } = useTranslation('device_details')
  const runs = data?.data ?? []

  const runsMutable = [...runs]
  const runsSorted = runsMutable.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const { data: protocolsData } = useAllProtocolsQuery()
  const protocols = protocolsData?.data ?? []

  const [selectedRun, setSelectedRun] = useState<RunData | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [initialDeleteAfterDownload, setInitialDeleteAfterDownload] =
    useState(true)

  const handleOverflowClick = (run: RunData): void => {
    setSelectedRun(run)
  }

  const handleCloseConfirmModal = (): void => {
    setSelectedRun(null)
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
    setSelectedRun(null)
  }

  if (data?.data.length === 0) {
    return (
      <OddInfoScreen
        type="neutral"
        header={t('no_recent_runs')}
        height="100%"
      />
    )
  }
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText oddStyle="bodyTextSemiBold">
          {t('protocol_name')}
        </StyledText>
        <StyledText oddStyle="bodyTextSemiBold">
          {t('last_run_date')}
        </StyledText>
        <StyledText oddStyle="bodyTextSemiBold">{t('run_status')}</StyledText>
      </div>
      {runsSorted.map(run => {
        const protocol = protocols.find(({ id }) => run.protocolId === id)
        const { chipType, listItemType } = runStatusToRecordProps(run.status)
        return (
          <ListItem
            key={run.id}
            type={listItemType}
            padding={SPACING.spacing24}
            className={styles.record}
          >
            <div className={styles.record_content}>
              <StyledText
                oddStyle="bodyTextSemiBold"
                className={styles.protocol_name}
              >
                {protocol?.metadata.protocolName ?? t('na')}
              </StyledText>
              <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
                {formatTimestamp(run.createdAt)}
              </StyledText>
              <Chip
                text={i18n.format(run.status, 'capitalize')}
                type={chipType}
                chipSize="small"
                width={FLEX_MIN_CONTENT}
                background={false}
              />
            </div>
            <OverflowBtn
              justifySelf={ALIGN_FLEX_END}
              onClick={() => {
                handleOverflowClick(run)
              }}
            />
          </ListItem>
        )
      })}
      {selectedRun != null ? (
        <ConfirmRunRecordModal
          onClose={handleCloseConfirmModal}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      ) : null}
      {showWizard && selectedRun != null ? (
        <DownloadDeleteRunRecordWizard
          run={selectedRun}
          initialDeleteAfterDownload={initialDeleteAfterDownload}
          onClose={handleCloseWizard}
        />
      ) : null}
    </div>
  )
}

const runStatusToRecordProps = (
  runStatus: RunStatus
): { chipType: ChipType; listItemType: ListItemType } => {
  switch (runStatus) {
    case 'succeeded':
      return { chipType: 'success', listItemType: 'success' }
    case 'failed':
      return { chipType: 'error', listItemType: 'error' }
    case 'stopped': {
      return { chipType: 'neutral', listItemType: 'default' }
    }
    default:
      return { chipType: 'neutral', listItemType: 'default' }
  }
}
