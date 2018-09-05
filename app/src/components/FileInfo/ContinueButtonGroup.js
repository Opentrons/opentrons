// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {OutlineButton, PrimaryButton} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  runDisabled: boolean,
}

export default function ContinueButtonGroup (props: Props) {
  const {runDisabled} = props
  return (
    <div className={styles.button_group}>
      <OutlineButton
        Component={Link}
        to='/calibrate'
        className={styles.continue_button}
      >
        Calibrate Labware
      </OutlineButton>
      <PrimaryButton
        Component={Link}
        to='/run'
        disabled={runDisabled}
        className={styles.continue_button}
      >
        Proceed to Run
      </PrimaryButton>
    </div>
  )
}
