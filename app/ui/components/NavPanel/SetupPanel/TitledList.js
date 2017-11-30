import React from 'react'
import styles from './link-list.css'

export default function TitledList (props) {
  return (
    <ol className={styles.labeled_list}>
      <h3 className={styles.list_title}>{props.title}</h3>
      {props.children}
    </ol>
  )
}
