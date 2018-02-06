// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'
import type {StepSubItemData} from '../steplist/types'
import styles from './StepItem.css'

export type StepSubItemProps = StepSubItemData /* & {|
  onMouseOver?: (event: SyntheticEvent<>) => void
|} */

export default function StepSubItem (props: StepSubItemProps) {
  if (props.stepType === 'transfer') {
    const {sourceIngredientName, destIngredientName, sourceWell, destWell} = props /* ,onMouseOver */
    return (
      <li className={styles.step_subitem} /* onMouseOver={onMouseOver} */>
        <span>{sourceIngredientName}</span>
        <span className={styles.emphasized_cell}>{sourceWell}</span>
        <Icon name='arrow right' />
        <span className={styles.emphasized_cell}>{destWell}</span>
        <span>{destIngredientName}</span>
      </li>
    )
  }

  if (props.stepType === 'pause') {
    // TODO: style pause stuff
    if (props.waitForUserInput) {
      return <li>{props.message}</li>
    }
    const {hours, minutes, seconds} = props
    return <li>{hours} hr {minutes} m {seconds} s</li>
  }

  return <li>TODO: substeps for {props.stepType}</li>
}
