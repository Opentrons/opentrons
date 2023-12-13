/** A full-page icon in a muted color */
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '../icons'
import styles from './Splash.module.css'

import type { IconName } from '../icons'

export interface SplashProps {
  /** optional alternative icon name. Defaults to 'logo'. */
  iconName?: IconName
  /** additional className for Splash */
  className?: string
}

export function Splash(props: SplashProps): JSX.Element {
  return (
    <div className={cx(styles.splash, props.className)}>
      <Icon name={props.iconName || 'ot-logo'} />
    </div>
  )
}
