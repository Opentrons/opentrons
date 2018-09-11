// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {PrimaryButton} from '@opentrons/components'
import styles from './styles.css'

export default function Continue () {
  return (
    <div className={styles.continue}>
      <PrimaryButton
        Component={Link}
        to='/calibrate'
        className={styles.continue_button}
      >
        Proceed to Calibrate
      </PrimaryButton>
    </div>
  )
}
