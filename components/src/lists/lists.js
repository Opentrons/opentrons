// @flow
// list components

import * as React from 'react'
import classnames from 'classnames'

import styles from './lists.css'
import {type IconName, Icon} from '../icons'

type ListProps = {
  onClick?: (event: SyntheticEvent<>) => void,
  className?: string,
  iconName?: IconName,
  title?: string,
  children?: React.Node
}

function List (props: ListProps) {
  return (
    <ol className={props.className}>
      {props.children}
    </ol>
  )
}

export default function TitledList (props: ListProps) {
  const className = classnames(styles.titled_list, props.className)
  const titleIcon = props.iconName && (<Icon className={styles.list_title_icon} name={props.iconName} />)
  return (
    <List {...props} className={className}>
      <div className={styles.list_title_bar}>
        {titleIcon}
        <h3 className={styles.list_title}>{props.title}</h3>
      </div>
      {props.children}
    </List>
  )
}
