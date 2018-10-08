// @flow
/** A full-page icon in a muted color */
import * as React from 'react'
import cx from 'classnames'
import {Icon, type IconName} from '../icons'

import styles from './Splash.css'

type Props = {
  /** optional alternative icon name. Defaults to 'logo'. */
  iconName?: IconName,
  /** additional className for Splash */
  className?: string,
}

export default function Splash (props: Props) {
  return (
    <div className={cx(styles.splash, props.className)}>
      <Icon name={props.iconName || 'ot-logo'} />
    </div>
  )
}
