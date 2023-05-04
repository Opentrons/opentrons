import { NavLink } from './NavLink'
import { supportLinkProps, salesLinkProps } from './nav-data'
import styles from './styles.css'
import map from 'lodash/map'
import * as React from 'react'

export function SupportMobileContent(): JSX.Element {
  const supportLinks = map(supportLinkProps)
  const salesLinks = map(salesLinkProps)
  return (
    <div className={styles.support_mobile_content}>
      <div className={styles.sales_group}>
        <h3 className={styles.submenu_title}>Sales</h3>
        <ul>
          {salesLinks.map(link => (
            <li key={link.name}>
              <NavLink {...link} className={styles.support_nav_link} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.support_group}>
        <h3 className={styles.submenu_title}>Support</h3>
        <ul>
          {supportLinks.map(link => (
            <li key={link.name}>
              <NavLink {...link} className={styles.support_nav_link} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
