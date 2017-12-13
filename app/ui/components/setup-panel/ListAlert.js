import React from 'react'
import styles from './link-list.css'

export default function ListAlert (props) {
  return (
    <li className={styles.alert}>{props.children}</li>
  )
}
