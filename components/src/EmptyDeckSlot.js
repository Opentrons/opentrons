// @flow
import * as React from 'react'

import {CenteredTextSvg} from './CenteredTextSvg'
import {LabwareContainer} from './LabwareContainer'
import styles from './LabwareContainer.css'

import type {DeckSlotProps} from '../types/DeckSlot'

export function EmptyDeckSlot (props: DeckSlotProps) {
  const {slotName} = props
  return <LabwareContainer {...props}>
    <g className={styles.empty_slot}>
      <rect width='100%' height='100%' />
      <CenteredTextSvg text={slotName} />
    </g>
  </LabwareContainer>
}
