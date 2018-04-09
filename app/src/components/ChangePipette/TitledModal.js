// @flow
// titled modal component
// TODO(mc, 2018-04-05): move to components library when ready
import * as React from 'react'
import {TitleBar, Overlay} from '@opentrons/components'

import styles from './styles.css'

type Props = React.ElementProps<typeof TitleBar> & {
  children?: React.Node
}

export default function TitledModal (props: Props) {
  return (
    <div className={styles.modal}>
      <Overlay />
      <TitleBar {...props} className={styles.title_bar} />
      <div className={styles.modal_contents}>
        {props.children}
      </div>
    </div>
  )
}
