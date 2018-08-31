import * as React from 'react'
import styles from './styles.css'

export default function InfoSection (props) {
  return (
    <section className={styles.info_section}>
      {props.title && (<h3 className={styles.title}>{props.title}</h3>)}
      {props.children}
    </section>
  )
}
