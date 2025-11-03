import {
  COLORS,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'

import styles from './labeledvalue.module.css'

interface LabeledValueProps {
  label: string
  value: ReactNode
}

export function LabeledValue(props: LabeledValueProps): JSX.Element {
  return (
    <div className={styles.container}>
      <StyledText desktopStyle='bodyDefaultRegular' color={COLORS.grey60}>
        {props.label}
      </StyledText>
      {typeof props.value === 'string' ? (
        <StyledText desktopStyle="bodyDefaultRegular">{props.value}</StyledText>
      ) : (
        props.value
      )}
    </div>
  )
}
