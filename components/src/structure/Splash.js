// @flow
/** A full-page icon in a muted color */
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '../icons'
import type { IconName } from '../icons'
import styles from './Splash.css'

export type SplashProps = {|
  /** optional alternative icon name. Defaults to 'logo'. */
  iconName?: IconName,
  /** additional className for Splash */
  className?: string,
|}

export function Splash(props: SplashProps): React.Node {
  return (
    <div className={cx(styles.splash, props.className)}>
      <Icon name={props.iconName || 'ot-logo'} />
    </div>
  )
}
