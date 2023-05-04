/** A full-page icon in a muted color */
import { Icon } from '../icons'
import type { IconName } from '../icons'
import styles from './Splash.css'
import cx from 'classnames'
import * as React from 'react'

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
