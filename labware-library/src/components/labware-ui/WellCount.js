// @flow
import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'
import { NUM_WELLS_BY_CATEGORY } from '../../localization'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type WellCountProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function WellCount(props: WellCountProps) {
  const { wells, metadata } = props.definition
  const { displayCategory } = metadata
  const numWellsLabel =
    NUM_WELLS_BY_CATEGORY[displayCategory] || NUM_WELLS_BY_CATEGORY.other

  return (
    <div className={props.className}>
      <div className={styles.well_count_data}>
        <LabelText position={LABEL_LEFT}>{numWellsLabel}</LabelText>
        <Value>{Object.keys(wells).length}</Value>
      </div>
    </div>
  )
}
