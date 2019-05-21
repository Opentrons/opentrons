// @flow
import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'
import { NUM_WELLS_BY_CATEGORY } from '../../localization'
import styles from './styles.css'

import type { LabwareDisplayCategory } from '../../types'

export type WellCountProps = {|
  count: number,
  displayCategory: LabwareDisplayCategory,
  className?: string,
|}

export function WellCount(props: WellCountProps) {
  const { count, displayCategory, className } = props
  const numWellsLabel =
    NUM_WELLS_BY_CATEGORY[displayCategory] || NUM_WELLS_BY_CATEGORY.other

  return (
    <div className={className}>
      <div className={styles.well_count_data}>
        <LabelText position={LABEL_LEFT}>{numWellsLabel}</LabelText>
        <Value>{count}</Value>
      </div>
    </div>
  )
}
