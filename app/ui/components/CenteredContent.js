// vertically and horizontally CenteredContent component
import React from 'react'
import classnames from 'classnames'

import styles from './CenteredContent.css'

const STYLE = classnames(
  'flex flex__items_center flex__justify_center',
  styles.container
)

export default function CenteredContent (props) {
  return (
    <div className={STYLE}>
      <div>
        {props.children}
      </div>
    </div>
  )
}
