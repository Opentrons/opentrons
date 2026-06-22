import { StyledText } from '../StyledText'
import styles from './storage.module.css'

interface StorageProps {
  percentUsed: number
  label: string
}

export function Storage({ percentUsed, label }: StorageProps): JSX.Element {
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
          style={{ '--fill-percent': `${clamped}%` }}
        >
          <div className={styles.fill} />
        </div>
        <div className={styles.legend}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="smallBodyTextRegular"
            className={styles.legend_text}
          >
            {`${clamped}% used`}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="smallBodyTextRegular"
            className={styles.legend_text}
          >
            {`${percentAvailable}% available`}
          </StyledText>
        </div>
      </div>
    </div>
  )
}
