// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {PrimaryButton} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  url: string,
}

export default function CheckPipettesButton (props: Props) {
  return (
    <PrimaryButton
      Component={Link}
      to={props.url}
      className={styles.check_pipette_button}
    >
      have robot check connection
    </PrimaryButton>
  )
}
