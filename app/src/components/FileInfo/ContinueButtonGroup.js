import * as React from 'react'
import {Link} from 'react-router-dom'

import {OutlineButton, PrimaryButton} from '@opentrons/components'
import styles from './styles.css'

export default function ContinueButtonGroup (props) {
  return (
    <div className={styles.button_group}>
      <OutlineButton
        Component={Link}
        to='calibrate/labware'
        className={styles.continue_button}
      >
        Calibrate Labware
      </OutlineButton>
      <PrimaryButton
        Component={Link}
        to='run'
        className={styles.continue_button}
      >
        Proceed to Run
      </PrimaryButton>
    </div>
  )
}
