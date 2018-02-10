// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'
import type {TransferishStepItem} from '../steplist/types'
import styles from './StepItem.css'

export type StepSubItemProps = TransferishStepItem /* & {|
  onMouseOver?: (event: SyntheticEvent<>) => void
|} */

// This "transferish" substep component is for transfer/distribute/consolidate
export default function TransferishSubstep (props: StepSubItemProps) {
  return props.rows.map((row, key) =>
    <li key={key} className={styles.step_subitem} /* onMouseOver={onMouseOver} */>
      <span>{row.sourceIngredientName}</span>
      <span className={styles.emphasized_cell}>{row.sourceWell}</span>
      <Icon name='arrow right' />
      <span className={styles.emphasized_cell}>{row.destWell}</span>
      <span>{row.destIngredientName}</span>
    </li>
  )
}
