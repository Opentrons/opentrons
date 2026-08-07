import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  Chip,
  COLORS,
  Icon,
  ListItem,
  StyledText,
  Tag,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { useNotifyAllRunsQuery } from '/app/resources/runs'
import { formatTimestamp } from '/app/transformations/runs'

import styles from './compliancereadysoftwarefiles.module.css'

import type { LogPeriodSummary } from '@opentrons/api-client'

interface LogPeriodRowProps {
  period: LogPeriodSummary
  isSelected: boolean
  isDeleting: boolean
  onToggle: () => void
}

export function LogPeriodRow({
  period,
  isSelected,
  isDeleting,
  onToggle,
}: LogPeriodRowProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const isComplete = period.endedAt != null
  const { data: protocolsData } = useAllProtocolsQuery()
  const { data: runsData } = useNotifyAllRunsQuery()
  const protocols = protocolsData?.data ?? []
  const runs = runsData?.data ?? []
  const foundRun = runs.find(
    run => 'logPeriodId' in run && run.logPeriodId === period.id
  )
  const foundProtocolName = protocols.find(
    ({ id }) => id === foundRun?.protocolId
  )?.metadata.protocolName

  return (
    <ListItem type="default">
      <div className={styles.log_period_row}>
        {isDeleting ? (
          <Icon name="ot-spinner" spin size="1rem" color={COLORS.grey60} />
        ) : (
          <CheckboxBasic
            checked={isSelected}
            onChange={onToggle}
            backgroundColor={COLORS.white}
          />
        )}
        <div className={styles.log_period_columns}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {foundProtocolName ?? t('na')}
          </StyledText>
          <div className={styles.log_date_col}>
            <Tag
              text={formatTimestamp(period.startedAt)}
              type="default"
              shrinkToContent
            />
          </div>
          <div className={styles.log_date_col}>
            <Tag
              text={
                period.endedAt != null
                  ? formatTimestamp(period.endedAt)
                  : t('na')
              }
              type="default"
              shrinkToContent
            />
          </div>
          <div className={styles.log_status_col}>
            <Chip
              text={isComplete ? t('complete') : t('in_progress')}
              type={isComplete ? 'success' : 'info'}
              hasIcon={false}
              chipSize="small"
              width="max-content"
            />
          </div>
        </div>
      </div>
    </ListItem>
  )
}
