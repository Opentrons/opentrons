// @flow
// prompt for ReviewDeckModal of labware calibration page
import * as React from 'react'

import type {Labware} from '../../robot'
import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type Props = Labware & {
  onClick: () => void
}

export default function Prompt (props: Props) {
  const {name, type, slot, onClick} = props

  return (
    <div className={styles.prompt}>
      <p className={styles.prompt_text}>
        To calibrate labware on the deck, position full tipracks and empty labware in their designated slots as illustrated below
      </p>
      <OutlineButton className={styles.prompt_button} onClick={onClick}>
        {`Calibrate ${name} (${type}) in slot ${slot}`}
      </OutlineButton>
    </div>
  )
}
