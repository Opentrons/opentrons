// @flow
import * as React from 'react'

import {PrimaryButton} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  onClick: () => mixed
}

export default function CheckPipettesButton (props: Props) {
  return (
    <PrimaryButton
      onClick={props.onClick}
      className={styles.check_pipette_button}
    >
      have robot check connection
    </PrimaryButton>
  )
}
