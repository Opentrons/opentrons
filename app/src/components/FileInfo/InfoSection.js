// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  title: string,
  children: React.Node,
}

export default function InfoSection(props: Props) {
  return (
    <section className={styles.info_section}>
      <h3 className={styles.title}>{props.title}</h3>
      {props.children}
    </section>
  )
}
