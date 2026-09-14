import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import { COLORS, Icon, truncateString } from '@opentrons/components'

import { useScrollPosition } from '/app/local-resources/dom-utils'
import { getLocalRobot } from '/app/redux/discovery'
import { useAccountIconInitial } from '/app/resources/access-control/useAccountIconInitial'
import { useNetworkConnection } from '/app/resources/networking/hooks/useNetworkConnection'

import styles from './navigation.module.css'
import { NavigationMenu } from './NavigationMenu'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { ON_DEVICE_DISPLAY_PATHS } from '/app/App/OnDeviceDisplayApp'

const NAV_LINKS: Array<(typeof ON_DEVICE_DISPLAY_PATHS)[number]> = [
  '/protocols',
  '/instruments',
  '/robot-settings',
]

const CHAR_LIMIT_WITH_ICON = 12
const CHAR_LIMIT_NO_ICON = 15

interface NavigationProps {
  //  optionalProps for setting the zIndex and position between multiple sticky elements
  //  used for ProtocolDashboard
  setNavMenuIsOpened?: Dispatch<SetStateAction<boolean>>
  longPressModalIsOpened?: boolean
}
export function Navigation(props: NavigationProps): ReactNode {
  const { setNavMenuIsOpened, longPressModalIsOpened } = props

  const { t } = useTranslation('top_navigation')

  const location = useLocation()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const accountIcon = useAccountIconInitial(robotName)

  const [showNavMenu, setShowNavMenu] = useState<boolean>(false)

  // We need to display an icon for what type of network connection (if any)
  // is active next to the robot's name. The designs call for it to change color
  // from black70 to black100 depending on the which page is being displayed
  // but we are using ReactRouter NavLinks, which doesn't easily support complex
  // children like this. For now the icon will just be black70 regardless.
  //
  // TODO(ew, 05/21/2023): Integrate icon into NavLink so color changes
  const networkConnection = useNetworkConnection(robotName)
  const { icon: iconName } = networkConnection

  const handleMenu = (openMenu: boolean): void => {
    if (setNavMenuIsOpened != null) {
      setNavMenuIsOpened(openMenu)
    }
    setShowNavMenu(openMenu)
  }

  const { scrollRef, isScrolled } = useScrollPosition()

  const navBarScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    navBarScrollRef?.current?.scrollIntoView({
      behavior: 'auto',
      inline: 'center',
    })
  }, [])

  const navMenuOrModalIsOpened = showNavMenu || Boolean(longPressModalIsOpened)

  function getPathDisplayName(path: (typeof NAV_LINKS)[number]): string {
    switch (path) {
      case '/instruments':
        return t('instruments')
      case '/protocols':
        return t('protocols')
      case '/robot-settings':
        return t('settings')
      default:
        return ''
    }
  }

  return (
    <>
      {/* Empty box to detect scrolling */}
      <div ref={scrollRef} />
      <nav
        className={clsx(
          styles.nav_bar,
          navMenuOrModalIsOpened
            ? styles.nav_bar_static
            : styles.nav_bar_sticky,
          isScrolled && styles.nav_bar_scrolled
        )}
      >
        <div className={styles.carousel_scroll_container}>
          <div className={styles.carousel_contents}>
            <div
              ref={location.pathname === '/dashboard' ? navBarScrollRef : null}
            >
              <NavigationLink
                to="/dashboard"
                name={truncateString(
                  robotName,
                  iconName != null ? CHAR_LIMIT_WITH_ICON : CHAR_LIMIT_NO_ICON
                )}
              />
            </div>
            {iconName != null ? (
              <Icon
                aria-label="network icon"
                name={iconName}
                size="2.5rem"
                color={COLORS.grey60}
              />
            ) : null}
            {NAV_LINKS.map(path => (
              <div
                ref={path === location.pathname ? navBarScrollRef : null}
                key={path}
              >
                <NavigationLink to={path} name={getPathDisplayName(path)} />
              </div>
            ))}
          </div>
        </div>
        {accountIcon.showIcon && (
          <NavLink
            to="/account"
            className={clsx(styles.account_icon, styles.cursor_default)}
            aria-label={t('account')}
          >
            {accountIcon.iconContents}
          </NavLink>
        )}
        <button
          type="button"
          className={clsx(styles.icon_button, styles.cursor_default)}
          aria-label="overflow menu button"
          onClick={() => {
            handleMenu(true)
          }}
        >
          <Icon
            name="overflow-btn-touchscreen"
            height="3.75rem"
            width="3rem"
            color={COLORS.grey60}
          />
        </button>
      </nav>
      {showNavMenu && (
        <NavigationMenu
          onClick={() => {
            handleMenu(false)
          }}
          robotName={robotName}
          setShowNavMenu={setShowNavMenu}
        />
      )}
    </>
  )
}

const NavigationLink = (props: { to: string; name: string }): ReactNode => (
  <NavLink
    to={props.to}
    className={({ isActive }) =>
      clsx(
        styles.touch_nav_link,
        isActive && styles.touch_nav_link_active,
        styles.cursor_default
      )
    }
  >
    {props.name}
    <div className={styles.nav_link_indicator} />
  </NavLink>
)
