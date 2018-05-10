// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '@opentrons/components'
import styles from './StepItem.css'

type AspirateDispenseHeaderProps = {
  sourceLabwareName: ?string,
  destLabwareName: ?string
}

function AspirateDispenseHeader (props: AspirateDispenseHeaderProps) {
  const {sourceLabwareName, destLabwareName} = props

  return [
    <li key='header-0' className={styles.aspirate_dispense}>
        <span>ASPIRATE</span>
        <span className={styles.spacer}/>
        <span>DISPENSE</span>
    </li>,

    <li key='header-1' className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
      <span>{sourceLabwareName}</span>
      {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
      <Icon name='ot-transfer' />
      <span>{destLabwareName}</span>
    </li>
  ]
}

export default AspirateDispenseHeader
