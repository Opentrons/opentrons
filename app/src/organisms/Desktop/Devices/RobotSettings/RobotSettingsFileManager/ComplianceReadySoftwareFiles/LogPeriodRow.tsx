import { useTranslation } from 'react-i18next'

import { CheckboxBasic, Chip, COLORS, Tag } from '@opentrons/components'

import { formatTimestamp } from '/app/transformations/runs'

import styles from './compliancereadysoftwarefiles.module.css'

import type { LogPeriodSummary } from '@opentrons/api-client'

interface LogPeriodRowProps {
  period: LogPeriodSummary
  isSelected: boolean
  onToggle: () => void
}

export function LogPeriodRow({
  period,
  isSelected,
  onToggle,
}: LogPeriodRowProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const isComplete = period.endedAt != null

  return (
    <div className={styles.compliance_period_row}>
      <CheckboxBasic
        checked={isSelected}
        onChange={onToggle}
        backgroundColor={COLORS.white}
      />
      <div className={styles.compliance_period_card_outer}>
        <div className={styles.compliance_period_card_inner}>
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
          <div className={styles.log_date_col}>
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
    </div>
  )
}
