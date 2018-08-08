// @flow
// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.css'

type Props = {
  /** Card contents */
  children: React.Node,
  /** If card can not be used, gray it out and remove pointer events */
  disabled?: boolean,
  /** Additional class names */
  className?: string
}

/**
 * Renders a basic card element with a white background, dropshadow, and zero padding.
 *
 * Titles and other children handle thier own styles and layout.
 */
export default function Card (props: Props) {
  const {children} = props

  const style = cx(styles.card, props.className, {
    [styles.disabled]: props.disabled
  })

  return (
    <section className={style}>
      {children}
    </section>
  )
}
