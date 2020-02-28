// @flow
// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.css'

export type CardProps = {|
  /** Title for card, all cards should receive a title. */
  title?: React.Node,
  /** Card contents */
  children?: React.Node,
  /** If card can not be used, gray it out and remove pointer events */
  disabled?: boolean,
  /** Additional class names */
  className?: string,
|}

/**
 * Renders a basic card element with a white background, dropshadow, and zero padding.
 *
 * Titles and other children handle their own styles and layout.
 */
export function Card(props: CardProps) {
  const { title, children } = props

  const style = cx(styles.card, props.className, {
    [styles.disabled]: props.disabled,
  })

  return (
    <section className={style}>
      {title && <h3 className={styles.card_title}>{title}</h3>}
      {children}
    </section>
  )
}
