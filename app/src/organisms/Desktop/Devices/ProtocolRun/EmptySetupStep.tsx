import { StyledText } from '@opentrons/components'

import styles from './emptysetupstep.module.css'

import type { ReactNode } from 'react'

interface EmptySetupStepProps {
  title: ReactNode
  description: string
  rightElement?: ReactNode
}

export function EmptySetupStep(props: EmptySetupStepProps): ReactNode {
  const { title, description, rightElement } = props
  return (
    <div className={styles.container}>
      <div className={styles.text_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">{description}</StyledText>
      </div>
      {rightElement}
    </div>
  )
}
