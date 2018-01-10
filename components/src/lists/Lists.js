// @flow
// list components

import * as React from 'react'
import cx from 'classnames'

import styles from './lists.css'
import styleIndex from '../styles/index.css'
import {type IconName, Icon, CHEVRON_DOWN, CHEVRON_RIGHT} from '../icons'

type ListProps = {
  /** text of title */
  title: string,
  /** children must all be `<li>` */
  children: React.Node,
  /** additional classnames */
  className?: string,
  /** sets collapsed appearance. List is expanded by default. */
  collapsed?: boolean,
  /** component with descriptive text about the list */
  description?: string,
  /** optional icon before h3 */
  iconName?: IconName,
  /** optional click action (on title div, not children) */
  onClick?: (event: SyntheticEvent<>) => void,
  /** optional click action (on carat click only, not rest of title div).
   * If defined, the TitledList is expandable and the carat is visible
   */
  onCollapseToggle?: (event: SyntheticEvent<>) => void,
  /** highlights the whole TitledList if true */
  selected?: boolean
}

function List (props: ListProps) {
  return (
    <ol className={props.className}>
      {props.children}
    </ol>
  )
}

/**
 * An ordered list with optional title, icon, and description.
 */
export default function TitledList (props: ListProps) {
  const {onCollapseToggle} = props
  const titleIcon = props.iconName && (<Icon className={styles.list_title_icon} name={props.iconName} />)
  const collapsible = onCollapseToggle !== undefined

  // clicking on the carat will not call props.onClick,
  // so prevent bubbling up if there is an onCollapseToggle fn
  const handleCollapseToggle = e => {
    if (onCollapseToggle) {
      e.stopPropagation()
      onCollapseToggle(e)
    }
  }

  return (
    <div className={cx({[styles.list_selected]: props.selected}, props.className)}>
      <div onClick={props.onClick}
        className={cx(styles.list_title_bar, {[styleIndex.clickable]: props.onClick})}
      >
        {titleIcon}
        <h3 className={styles.list_title}>{props.title}</h3>
        {collapsible &&
          <div onClick={handleCollapseToggle}
            className={styles.accordion_carat}
          >
            {/* TODO Ian 2018-01-08 make separate up and down carat icons */}
            <Icon name={props.collapsed ? CHEVRON_DOWN : CHEVRON_RIGHT} />
          </div>
        }
      </div>
      {!props.collapsed && props.description}
      {!props.collapsed &&
        <List {...props} className={styles.titled_list}>
          {props.children}
        </List>
      }
    </div>
  )
}
