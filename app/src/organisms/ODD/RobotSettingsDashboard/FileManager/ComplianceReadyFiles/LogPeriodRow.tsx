import { useTranslation } from 'react-i18next'

import { ListItem, StyledText, Tag } from '@opentrons/components'

import { formatTimestamp } from '/app/transformations/runs'

import { OverflowMenuButton } from '../OverflowMenuButton'
import styles from './compliancereadyfiles.module.css'

import type { ReactNode } from 'react'
import type { LogPeriodSummary } from '@opentrons/api-client'

interface LogPeriodRowProps {
  logPeriodSummary: LogPeriodSummary
  protocolName: string | null
  handleOverflowClick: (logPeriodSummary: LogPeriodSummary) => void
}

export function LogPeriodRow(props: LogPeriodRowProps): ReactNode {
  const { logPeriodSummary, protocolName, handleOverflowClick } = props
  const { t } = useTranslation('device_details')

  return (
    <ListItem type="default" className={styles.record_container}>
      <div className={styles.record_content}>
        <StyledText
          oddStyle="bodyTextSemiBold"
          className={styles.protocol_name}
        >
          {protocolName ?? t('na')}
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
      <OverflowMenuButton
        onClick={() => {
          handleOverflowClick(logPeriodSummary)
        }}
      />
    </ListItem>
  )
}
