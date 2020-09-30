// @flow
import * as React from 'react'
import styles from './styles.css'

export type DetailsBoxProps = {|
  children: React.Node,
  aside: React.Node,
|}

export function DetailsBox(props: DetailsBoxProps): React.Node {
  const { children, aside } = props

  return (
    <section className={styles.details_box}>
      <div className={styles.details_box_contents}>{children}</div>
      <aside className={styles.details_box_aside}>{aside}</aside>
    </section>
  )
}
