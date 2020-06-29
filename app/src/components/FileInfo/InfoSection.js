// @flow
import * as React from 'react'

import styles from './styles.css'

export type InfoSectionProps = {|
  title: string,
  children: React.Node,
|}

export function InfoSection(props: InfoSectionProps): React.Node {
  return (
    <section className={styles.info_section}>
      <h3 className={styles.title}>{props.title}</h3>
      {props.children}
    </section>
  )
}
