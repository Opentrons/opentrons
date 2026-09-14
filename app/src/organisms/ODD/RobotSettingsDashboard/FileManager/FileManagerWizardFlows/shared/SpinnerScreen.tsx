import { Icon, StyledText } from '@opentrons/components'

import styles from './shared.module.css'

import type { ReactNode } from 'react'

interface SpinnerScreenProps {
  statusText: string
}

export function SpinnerScreen({ statusText }: SpinnerScreenProps): ReactNode {
  return (
    <div className={styles.centered_content}>
      <Icon name="ot-spinner" spin size="6.25rem" />
      <StyledText oddStyle="level3HeaderBold" className={styles.status_text}>
        {statusText}
      </StyledText>
    </div>
  )
}
