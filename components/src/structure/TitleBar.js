// @flow
// TitleBar component

import * as React from 'react'
import cx from 'classnames'

import {FlatButton} from '../buttons'
import {CHEVRON_LEFT} from '../icons'
import styles from './structure.css'

type Props = {
  title: React.Node,
  subtitle?: React.Node,
  onBackClick?: () => void,
  backClickDisabled?: boolean,
  className?: string
}

export default function TitleBar (props: Props) {
  const {title, subtitle, onBackClick, backClickDisabled, className} = props

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

  const backButton = onBackClick && (
    <FlatButton
      className={styles.back_button}
      title='back'
      iconName={CHEVRON_LEFT}
      onClick={onBackClick}
      disabled={backClickDisabled}
    >
      Back
    </FlatButton>
  )

  return (
    <header className={cx(styles.title_bar, className)}>
      {backButton}
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
