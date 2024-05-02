// TitleBar component

import * as React from 'react'
import cx from 'classnames'

import { FlatButton } from '../buttons'
import styles from './structure.module.css'

import type { ButtonProps } from '../buttons'

export interface TitleBarProps {
  id?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  back?: ButtonProps
  rightNode?: React.ReactNode
  className?: string

  // TODO(mc, 2018-04-13): deprecate these props
  onBackClick?: () => unknown
  backClickDisabled?: boolean
  backButtonLabel?: string
}

/**
 * @deprecated Use `InterstitialTitleBar` instead
 */

export function TitleBar(props: TitleBarProps): JSX.Element {
  const {
    title,
    subtitle,
    className,
    onBackClick,
    backClickDisabled,
    backButtonLabel,
    id,
  } = props
  let { back, rightNode } = props

  const separator = subtitle && <span className={styles.separator}>|</span>

  const subheading = subtitle && <h2 className={styles.subtitle}>{subtitle}</h2>

  const rightNodeContainer = rightNode && (
    <div className={styles.right_node}>{rightNode}</div>
  )

  // TODO(mc, 2018-04-13): deprecate these props
  if (!back && onBackClick) {
    back = {
      onClick: onBackClick,
      disabled: backClickDisabled,
      title: backButtonLabel || 'Back',
      children: backButtonLabel || 'back',
    }
  }

  if (back) {
    back.children = back.children || 'back'
    back.title = back.title || 'Back'
  }

  return (
    <header id={id} className={cx(styles.title_bar, className)}>
      {back && (
        <FlatButton
          inverted
          iconName={'chevron-left'}
          className={styles.title_button}
          {...back}
        />
      )}
      {/*  @ts-expect-error(sa, 2021-6-23): cast value to boolean */}
      <h1 className={cx(styles.title, { [styles.right]: back })}>{title}</h1>
      {separator}
      {subheading}
      {rightNodeContainer}
    </header>
  )
}
