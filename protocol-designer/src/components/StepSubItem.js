// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'
import styles from './StepItem.css'

export type StepSubItemProps = {
  sourceIngredientName?: string,
  destIngredientName?: string,
  sourceWell?: string,
  destWell?: string,
  onMouseOver?: (event: SyntheticEvent<>) => void,
}

export default function StepSubItem (props: StepSubItemProps) {
  const {sourceIngredientName, destIngredientName, sourceWell, destWell, onMouseOver} = props
  return (
    <li className={styles.step_subitem} onMouseOver={onMouseOver}>
      <span>{sourceIngredientName}</span>
      <span className={styles.emphasized_cell}>{sourceWell}</span>
      <Icon name='arrow right' />
      <span className={styles.emphasized_cell}>{destWell}</span>
      <span>{destIngredientName}</span>
    </li>
  )
}
