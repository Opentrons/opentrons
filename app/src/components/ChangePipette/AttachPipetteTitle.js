// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {
  name: ?string,
}

export default function AttachPipetteTitle (props: Props) {
  const name = props.name || ''

  return (
    <h3 className={styles.attach_pipette_title}>
      Attach {name} Pipette
    </h3>
  )
}
