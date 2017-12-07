// vertically and horizontally CenteredContent component
import React from 'react'

import styles from './CenteredContent.css'

export default function CenteredContent (props) {
  return (
    <div className={styles.container}>
      <div>
        {props.children}
      </div>
    </div>
  )
}
