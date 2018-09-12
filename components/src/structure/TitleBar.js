// @flow
// TitleBar component

import * as React from 'react'
import cx from 'classnames'

import {FlatButton, type ButtonProps} from '../buttons'
import styles from './structure.css'

export type TitleBarProps = {
  title: React.Node,
  subtitle?: React.Node,
  back?: ButtonProps,
  className?: string,

  // TODO(mc, 2018-04-13): deprecate these props
  onBackClick?: () => mixed,
  backClickDisabled?: boolean,
  backButtonLabel?: string,
}

export default function TitleBar (props: TitleBarProps) {
  const {
    title,
    subtitle,
    className,
    onBackClick,
    backClickDisabled,
    backButtonLabel,
  } = props
  let {back} = props

  const separator = subtitle && (
    <span className={styles.separator}>
      |
    </span>
  )

  const subheading = subtitle && (
    <h2 className={styles.subtitle}>
      {subtitle}
    </h2>
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
    <header className={cx(styles.title_bar, className)}>
      {back && (
        <FlatButton
          inverted
          iconName={'chevron-left'}
          {...back}
        />
      )}
      <div className={styles.title_wrapper}>
        <h1 className={styles.title}>
          {title}
        </h1>
        {separator}
        {subheading}
      </div>
    </header>
  )
}
