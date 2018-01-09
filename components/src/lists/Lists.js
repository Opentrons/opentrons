// @flow
// list components

import * as React from 'react'
import cx from 'classnames'

import styles from './lists.css'
import styleIndex from '../styles/index.css'
import {type IconName, Icon, EXPAND} from '../icons'

type ListProps = {
  title: string,
  children: React.Node,
  className?: string,
  collapsed?: boolean,
  description?: string,
  iconName?: IconName,
  onClick?: (event: SyntheticEvent<>) => void,
  onCollapseToggle?: (event: SyntheticEvent<>) => void,
  selected?: boolean
}

function List (props: ListProps) {
  return (
    <ol className={props.className}>
      {props.children}
    </ol>
  )
}

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
            {<Icon name={EXPAND} className={props.collapsed ? styleIndex.rotated : undefined} />}
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
