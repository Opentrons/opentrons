// @flow
import * as React from 'react'
import cx from 'classnames'

import { NavMenu } from './NavMenu'
import { MenuButton } from './MenuButton'
import styles from './MainNav.module.css'
import type { Submenu } from './types'
import { ClickOutside } from '@opentrons/components'

type Props = {|
  homeUrl: string,
  navigationList: Submenu[],
|}

export function NavList({ homeUrl, navigationList }: Props): React.Node {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menu, setMenu] = React.useState(null)

  const clear = () => setMenu(null)

  const toggle = (name: string | null) => setMenu(menu !== name ? name : null)

  const toggleMobile = () => {
    if (isOpen === false) {
      document.body !== null && document.body.classList.add('no_scroll')
    } else {
      document.body !== null && document.body.classList.remove('no_scroll')
    }
    setIsOpen(!isOpen)
  }

  React.useEffect(() => {
    return () => {
      document.body !== null && document.body.classList.remove('no_scroll')
    }
  }, [])

  return (
    <>
      <MenuButton onMobileClick={toggleMobile} isMobileOpen={isOpen} />
      <ClickOutside onClickOutside={clear}>
        {({ ref }) => (
          <ul
            className={cx(styles.nav_list, {
              [styles.nav_list_open]: isOpen,
              [styles.nav_list_submenu_open]: menu,
            })}
            ref={ref}
          >
            {navigationList.map(subnav => (
              <NavMenu
                {...subnav}
                key={subnav.name}
                active={menu === subnav.name}
                homeUrl={homeUrl}
                onToggle={name => toggle(name)}
              />
            ))}
            <a
              className={styles.nav_contact_button}
              href={`${homeUrl}/contact`}
              data-gtm-label={'contact-us'}
              data-gtm-category={'l-header'}
              data-gtm-action={'click'}
            >
              CONTACT SALES
            </a>
            <a
              className={styles.demo_button}
              href={`${homeUrl}/demo`}
              data-gtm-label={'schedule-demo'}
              data-gtm-category={'l-header'}
              data-gtm-action={'click'}
            >
              SCHEDULE DEMO
            </a>
          </ul>
        )}
      </ClickOutside>
    </>
  )
}
