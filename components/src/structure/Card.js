// @flow
// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.css'

type Props = {
  /** Title for card */
  title: React.Node,
  /** Card content, displays in a flex-row by default */
  children: React.Node,
  /** Displays card content in a flex-column */
  column?: boolean,
  /** If card can not be used, gray it out and remove pointer events */
  disabled?: boolean,
  /** Additional class names */
  className?: string
}

export default function Card (props: Props) {
  const {title, column, children} = props
  const style = cx(styles.card, props.className, {[styles.disabled]: props.disabled})
  return (
    <section className={style}>
      <h3 className={styles.card_title}>{title}</h3>
      <div className={cx(styles.card_content, {[styles.card_column]: column})}>
        {children}
      </div>
    </section>
  )
}
