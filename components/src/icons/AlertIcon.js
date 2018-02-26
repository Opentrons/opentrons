// @flow
import * as React from 'react'

import Icon from './Icon'
import cx from 'classnames'

import {type IconName} from './icon-data'
import styles from './icons.css'

type Props = {
  /** name constant of the base icon to display */
  baseName: IconName,
  /** classes to apply to base icon */
  className?: string,
  /** name constant of the secondary alert icon to display */
  alertName: IconName,
  /** classes to apply to alert icon.
  * Position, color, size, and toggle visibility with alertClassName. */
  alertClassName?: string
}

/**
 * Inline SVG icon component with additional nested alert icon
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import {type IconName} from '@opentrons/components'
 * ```
 */

export default function AlertIcon (props: Props) {
  return (
    <div className={styles.icon_wrapper}>
      <Icon
        name={props.baseName}
        className={props.className}
      />
      <Icon
        name={props.alertName}
        className={cx(styles.child_icon, props.alertClassName)}
      />
    </div>
  )
}
