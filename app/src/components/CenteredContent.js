// @flow
// vertically and horizontally CenteredContent component
import * as React from 'react'

import styles from './CenteredContent.css'

type Props = {children: React.Node}

export default function CenteredContent (props: Props) {
  return (
    <div className={styles.container}>
      <div>{props.children}</div>
    </div>
  )
}
