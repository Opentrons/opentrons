import * as React from 'react'
import cx from 'classnames'
import {LabeledValue, OutlineButton} from '@opentrons/components'
import styles from './styles.css'

const LEFT_LABEL = 'Left pipette'
const RIGHT_LABEL = 'Right pipette'
export default function InstrumentInfo (props) {
  const label = props.mount === 'left'
    ? LEFT_LABEL
    : RIGHT_LABEL
  const value = props.volume
    ? `${props.channels}-channel p${props.volume}`
    : 'no pipette attached'
  const buttonText = props.volume
    ? 'change'
    : 'attach'
  const className = cx(
    styles.instrument_card, {
      [styles.left]: props.mount === 'left',
      [styles.right]: props.mount === 'right'
    }
  )
  return (
    <div className={className}>
      <LabeledValue
        label={label}
        value={value}
      />
      <OutlineButton disabled>
        {buttonText}
      </OutlineButton>
      <div className={styles.image}></div>
    </div>
  )
}
