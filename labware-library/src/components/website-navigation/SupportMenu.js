// @flow
import * as React from 'react'

import { salesLinkProps, supportLinkProps } from './nav-data'
import { NavButton, NavLink } from './NavLink'
import styles from './styles.css'

type Props = {|
  active: boolean,
|}
export function SupportMenu(props: Props): React.Node {
  const { active } = props
  const {
    start,
    help,
    github,
    labware,
    app,
    warranty,
    support,
  } = supportLinkProps
  const { order, sales, demo } = salesLinkProps

  return (
    <>
      <span>Support & Sales</span>
      {active && (
        <div className={styles.dropdown_large}>
          <div className={styles.support_menu}>
            <h3 className={styles.submenu_title}>Support</h3>
            <div className={styles.support_content}>
              <div className={styles.dropdown_col}>
                <NavLink {...start} />
                <NavLink {...help} />
                <NavLink {...github} />
              </div>

              <div className={styles.dropdown_col}>
                <NavLink {...labware} />
                <NavLink {...app} />
                <NavLink {...warranty} />
                <NavLink {...support} cta />
              </div>
            </div>
          </div>
          <div className={styles.sales_menu}>
            <h3 className={styles.submenu_title}>Sales</h3>
            <NavLink {...order} />
            <NavLink {...sales} cta />
            <NavButton {...demo} />
            <div className={styles.sales_number}>
              <p>Sales rep hours</p>
              <p>9:00-17:00 EST</p>
              <p>(469) 431-1201</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
