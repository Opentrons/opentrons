// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import styles from './styles.css'

type Props = {|
  name: string,
  active: boolean,
  children?: React.Node,
  onClick: () => mixed,
|}

export function MobileMenu(props: Props) {
  const { name, active, onClick } = props
  return (
    <>
      <span onClick={onClick}>{name}</span>
      <div className={cx(styles.mobile_menu, { [styles.active]: active })}>
        <div className={styles.mobile_menu_heading} onClick={onClick}>
          <Icon className={styles.mobile_menu_icon} name="arrow-left" />
          <h3 className={styles.mobile_menu_title}>{name}</h3>
        </div>
        <div className={styles.scrollable_contents}>{props.children}</div>
      </div>
    </>
  )
}
