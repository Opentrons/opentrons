import * as React from 'react'
import styles from './styles.css'

export interface InfoSectionProps {
  title: string
  children: React.ReactNode
}

export function InfoSection(props: InfoSectionProps): JSX.Element {
  return (
    <section className={styles.info_section}>
      <h3 className={styles.title}>{props.title}</h3>
      {props.children}
    </section>
  )
}
