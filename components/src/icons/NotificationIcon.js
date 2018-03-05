// @flow
import * as React from 'react'

import Icon from './Icon'
import cx from 'classnames'

import {type IconName} from './icon-data'
import styles from './icons.css'

type Props = {
  /** name constant of the main icon to display */
  parentName: IconName,
  /** classes to apply to main icon */
  className?: string,
  /** name constant of the secondary notifcation icon to display */
  childName: IconName,
  /** classes to apply to notification icon.
  * Position, color, size, and toggle visibility with notificationClassName. */
  childClassName?: string
}

/**
 * Inline SVG icon component with additional nested notification icon
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import {type IconName} from '@opentrons/components'
 * ```
 */

export default function NotificationIcon (props: Props) {
  return (
    <div className={styles.icon_wrapper}>
      <Icon
        name={props.parentName}
        className={props.className}
      />
      <Icon
        name={props.childName}
        className={cx(styles.child_icon, props.childClassName)}
      />
    </div>
  )
}
