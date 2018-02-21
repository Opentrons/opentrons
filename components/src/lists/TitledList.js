// @flow
// TitledList component
import * as React from 'react'
import cx from 'classnames'

import styles from './lists.css'
import {type IconName, Icon, CHEVRON_DOWN, CHEVRON_RIGHT} from '../icons'

type ListProps = {
  /** text of title */
  title: string,
  /** optional icon left of the title */
  iconName?: IconName,
  // TOD(mc, 2018-01-25): enforce <li> children requirement with flow
  /** children must all be `<li>` */
  children?: React.Node,
  /** additional classnames */
  className?: string,
  /** component with descriptive text about the list */
  description?: React.Node,
  /** optional click action (on title div, not children) */
  onClick?: (event: SyntheticEvent<>) => void,
  /** caret click action; if defined, list is expandable and carat is visible */
  onCollapseToggle?: (event: SyntheticEvent<>) => void,
  /** collapse the list if true (false by default) */
  collapsed?: boolean,
  /** highlights the whole TitledList if true */
  selected?: boolean,
  /** disables the whole TitledList if true */
  disabled?: boolean,
  /** inline style */
  style?: {}
}

/**
 * An ordered list with optional title, icon, and description.
 */
export default function TitledList (props: ListProps) {
  const {iconName, disabled, onCollapseToggle, style} = props
  const collapsible = onCollapseToggle != null

  const onClick = !disabled
    ? props.onClick
    : undefined

  // clicking on the carat will not call props.onClick,
  // so prevent bubbling up if there is an onCollapseToggle fn
  const handleCollapseToggle = e => {
    if (onCollapseToggle && !disabled) {
      e.stopPropagation()
      onCollapseToggle(e)
    }
  }

  const hasValidChildren = React.Children.toArray(props.children)
    .some(child => child)

  const className = cx(styles.titled_list, props.className, {
    [styles.disabled]: disabled,
    [styles.titled_list_selected]: !disabled && props.selected
  })

  const titleBarClass = cx(styles.title_bar, {
    [styles.clickable]: props.onClick
  })

  return (
    <div className={className} style={style}>
      <div onClick={onClick} className={titleBarClass}>
        {iconName && (
          <Icon className={styles.title_bar_icon} name={iconName} />
        )}
        <h3 className={styles.title}>
          {props.title}
        </h3>
        {collapsible && (
          <div
            onClick={handleCollapseToggle}
            className={styles.title_bar_carat}
          >
            <Icon
              className={styles.title_bar_icon}
              name={props.collapsed ? CHEVRON_DOWN : CHEVRON_RIGHT}
            />
          </div>
        )}
      </div>
      {!props.collapsed && props.description}
      {!props.collapsed && hasValidChildren && (
        <ol className={styles.list}>
          {props.children}
        </ol>
      )}
    </div>
  )
}
