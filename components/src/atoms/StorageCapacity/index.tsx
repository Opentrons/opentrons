import type { CSSProperties } from 'react'

import { COLORS } from '../../helix-design-system'
import { StyledText } from '../StyledText'
import styles from './storagecapacity.module.css'

interface StorageCapacityProps {
  percentUsed: number
  label: string
  t?: (key: string, opts?: Record<string, unknown>) => string
}

export function StorageCapacity({
  percentUsed,
  label,
  t,
}: StorageCapacityProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, percentUsed))
  const percentAvailable = 100 - clamped

  return (
    <div className={styles.container}>
      <StyledText
        desktopStyle="bodyLargeSemiBold"
        oddStyle="bodyTextSemiBold"
        className={styles.label}
      >
        {label}
      </StyledText>
      <div className={styles.bar_section}>
        <div
          className={styles.track}
          role="meter"
          aria-label={label}
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={
            t != null
              ? `${t('percent_used', { percent: clamped })}, ${t('percent_available', { percent: percentAvailable })}`
              : `${clamped}% used, ${percentAvailable}% available`
          }
          style={{ '--fill-percent': `${clamped}%` } as CSSProperties}
        >
          <div className={styles.fill} />
        </div>
        <div className={styles.legend}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="smallBodyTextRegular"
            color={COLORS.grey60}
          >
            {t != null
              ? t('percent_used', { percent: clamped })
              : `${clamped}% used`}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="smallBodyTextRegular"
            color={COLORS.grey60}
          >
            {t != null
              ? t('percent_available', { percent: percentAvailable })
              : `${percentAvailable}% available`}
          </StyledText>
        </div>
      </div>
    </div>
  )
}
