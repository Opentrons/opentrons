// @flow
import * as React from 'react'
import { NavLink } from './NavLink'
import styles from './styles.css'

import {
  hardwareLinks,
  labwareLinks,
  consumableLinks,
  productCTALink,
} from './nav-data'

type Props = {||}

export function ProductMobileContent(props: Props) {
  return (
    <div className={styles.product_mobile_content}>
      <div className={styles.hardware_group}>
        <h3 className={styles.submenu_title}>Open-Source Hardware</h3>
        <ul>
          {hardwareLinks.map(link => (
            <li key={link.name}>
              <NavLink {...link} className={styles.product_nav_link} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.labware_group}>
        <h3 className={styles.submenu_title}>Verified Labware</h3>
        <ul>
          {labwareLinks.map(link => (
            <li key={link.name}>
              <NavLink {...link} className={styles.product_nav_link} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.consumable_group}>
        <h3 className={styles.submenu_title}>Consumables & Reagents</h3>
        <ul>
          {consumableLinks.map(link => (
            <li key={link.name}>
              <NavLink {...link} className={styles.product_nav_link} />
            </li>
          ))}
          <li>
            <NavLink {...productCTALink} className={styles.product_nav_link} />
          </li>
        </ul>
      </div>
    </div>
  )
}
