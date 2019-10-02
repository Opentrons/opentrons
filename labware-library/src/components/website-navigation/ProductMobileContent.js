// @flow
import * as React from 'react'
import map from 'lodash/map'
import NavLink from './NavLink'
import styles from './styles.css'

import {
  hardwareLinkProps,
  labwareLinkProps,
  consumableLinkProps,
  productCTAProps,
} from './nav-data'

type Props = {||}

export default function ProductMobileContent(props: Props) {
  const hardwareLinks = map(hardwareLinkProps)
  const labwareLinks = map(labwareLinkProps)
  const consumableLinks = map(consumableLinkProps)
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
            <NavLink {...productCTAProps} className={styles.product_nav_link} />
          </li>
        </ul>
      </div>
    </div>
  )
}
