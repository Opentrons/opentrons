// @flow
import * as React from 'react'

import { CenteredTextSvg } from '../CenteredTextSvg'
import LabwareWrapper from './LabwareWrapper'
import styles from './LabwareWrapper.css'

import type { DeckSlotProps } from '../../interfaces/DeckSlot'

// TODO(mc, 2018-07-16): this should be the default export
export function EmptyDeckSlot(props: DeckSlotProps) {
  const { slot } = props

  return (
    <LabwareWrapper {...props}>
      <g className={styles.empty_slot}>
        <rect width="100%" height="100%" />
        <CenteredTextSvg text={slot} />
      </g>
    </LabwareWrapper>
  )
}
