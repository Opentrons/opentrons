// @flow
// SidePanelGroup component
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '../icons'

import type { IconName } from '../icons'
import styles from './lists.css'

export type SidePanelGroupProps = {|
  /** text of title */
  title?: string,
  /** optional icon left of the title */
  iconName?: IconName,
  /** children, most likely one or more TitledList */
  children?: React.Node,
  /** additional classnames */
  className?: string,
  /** disables the whole SidePanelGroup if true */
  disabled?: boolean,
|}

/**
 * A component for grouping and titling multiple lists
 */
export function SidePanelGroup(props: SidePanelGroupProps): React.Node {
  const { iconName, disabled } = props

  const className = cx(styles.panel_group, props.className, {
    [styles.disabled]: disabled,
  })

  return (
    <div className={className}>
      {props.title && (
        <div className={styles.title_bar}>
          {iconName && (
            <Icon className={styles.title_bar_icon} name={iconName} />
          )}
          <h2 className={styles.title}>{props.title}</h2>
        </div>
      )}
      {props.children}
    </div>
  )
}
