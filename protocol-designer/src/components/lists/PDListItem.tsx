import * as React from 'react'
import cx from 'classnames'
import styles from './styles.module.css'

interface Props {
  className?: string | null
  /** show light gray border between list items */
  border?: boolean | null
  /** hover style when hovered (for redux-linked hover state, do not use this) */
  hoverable?: boolean | null
  [key: string]: unknown
}

/** Light wrapper around li for PD-specific styles */
export function PDListItem(props: Props): JSX.Element {
  const { className, border, hoverable, ...passThruProps } = props
  const _className = cx(
    {
      [styles.border]: props.border,
      [styles.hoverable]: props.hoverable,
    },
    styles.pd_list_item,
    props.className
  )
  return <li {...passThruProps} className={_className} />
}
