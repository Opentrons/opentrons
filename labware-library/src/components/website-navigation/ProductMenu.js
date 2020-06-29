// @flow
import * as React from 'react'

import {
  consumableLinks,
  hardwareLinks,
  labwareLinks,
  productCTALink,
} from './nav-data'
import { NavLink } from './NavLink'
import styles from './styles.css'

type Props = {|
  active: boolean,
|}

export function ProductMenu(props: Props): React.Node {
  const { active } = props
  return (
    <>
      <span>Products</span>
      {active && (
        <div className={styles.dropdown_medium}>
          <div className={styles.dropdown_content}>
            <div className={styles.dropdown_col}>
              <h3 className={styles.submenu_title}>Open-Source Hardware</h3>
              {hardwareLinks.map(link => (
                <li key={link.name}>
                  <NavLink {...link} className={styles.product_link} />
                </li>
              ))}
              <h3 className={styles.submenu_title}>Verified Labware</h3>
              {labwareLinks.map(link => (
                <li key={link.name}>
                  <NavLink {...link} className={styles.product_link} />
                </li>
              ))}
            </div>
            <div className={styles.dropdown_col}>
              <h3 className={styles.submenu_title}>Consumables & Reagents</h3>
              {consumableLinks.map(link => (
                <li key={link.name}>
                  <NavLink {...link} className={styles.product_link} />
                </li>
              ))}
            </div>
          </div>
          <a
            href={productCTALink.url}
            className={styles.bottom_link_center}
            target="_blank"
            rel="noopener noreferrer"
          >
            {productCTALink.name} ›
          </a>
        </div>
      )}
    </>
  )
}
