// @flow
// TitledList component
import * as React from 'react'
import cx from 'classnames'

import styles from './lists.css'
import {type IconName, Icon} from '../icons'

type ListProps = {
  /** text of title */
  title: string,
  /** optional icon left of the title */
  iconName?: ?IconName,
  /** props passed down to icon (`className` and `name` are ignored) */
  iconProps?: $Diff<React.ElementProps<typeof Icon>, {name: *}>,
  // TODO(mc, 2018-01-25): enforce <li> children requirement with flow
  /** children must all be `<li>` */
  children?: React.Node,
  /** additional classnames */
  className?: string,
  /** component with descriptive text about the list */
  description?: React.Node,
  /** optional click action (on title div, not children) */
  onClick?: (event: SyntheticMouseEvent<>) => mixed,
  /** optional mouseEnter action */
  onMouseEnter?: (event: SyntheticMouseEvent<>) => mixed,
  /** optional mouseLeave action */
  onMouseLeave?: (event: SyntheticMouseEvent<>) => mixed,
  /** caret click action; if defined, list is expandable and carat is visible */
  onCollapseToggle?: (event: SyntheticMouseEvent<>) => mixed,
  /** collapse the list if true (false by default) */
  collapsed?: boolean,
  /** set to true when TitledList is selected (eg, user clicked it) */
  selected?: boolean,
  /** set to true when TitledList is hovered (but not when its contents are hovered) */
  hovered?: boolean,
  /** disables the whole TitledList if true */
  disabled?: boolean,
}

/**
 * An ordered list with optional title, icon, and description.
 */
export default function TitledList (props: ListProps) {
  const {iconName, disabled, onCollapseToggle, iconProps, onMouseEnter, onMouseLeave} = props
  const collapsible = onCollapseToggle != null

  const onClick = !disabled
    ? props.onClick
    : undefined

  // clicking on the carat will not call props.onClick,
  // so prevent bubbling up if there is an onCollapseToggle fn
  const handleCollapseToggle = (e: SyntheticMouseEvent<>) => {
    if (onCollapseToggle && !disabled) {
      e.stopPropagation()
      onCollapseToggle(e)
    }
  }

  const hasValidChildren = React.Children.toArray(props.children)
    .some(child => child)

  const className = cx(styles.titled_list, props.className, {
    [styles.disabled]: disabled,
    [styles.titled_list_selected]: !disabled && props.selected,
    [styles.hover_border]: !disabled && props.hovered,
  })

  const titleBarClass = cx(styles.title_bar, {
    [styles.clickable]: props.onClick,
  })

  const iconClass = cx(styles.title_bar_icon, styles.icon_left_of_title, iconProps && iconProps.className)

  return (
    <div className={className} {...{onMouseEnter, onMouseLeave}}>
      <div onClick={onClick} className={titleBarClass}>
        {iconName && (
          <Icon {...iconProps} className={iconClass} name={iconName} />
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
              name={props.selected
                  ? 'chevron-right'
                  : (props.collapsed ? 'chevron-down' : 'chevron-up')}
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
