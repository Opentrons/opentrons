// @flow
// titled modal component
// TODO(mc, 2018-04-05): move to components library when ready
import * as React from 'react'
import cx from 'classnames'
import {TitleBar, Overlay} from '@opentrons/components'

import styles from './styles.css'

type Props = {
  titleBar: React.ElementProps<typeof TitleBar>,
  contentsClassName?: string,
  children?: React.Node
}

export default function TitledModal (props: Props) {
  const {titleBar} = props

  return (
    <div className={styles.modal}>
      <Overlay />
      {titleBar && (
        <TitleBar {...titleBar} className={styles.title_bar} />
      )}
      <div className={cx(styles.modal_contents, props.contentsClassName)}>
        {props.children}
      </div>
    </div>
  )
}
