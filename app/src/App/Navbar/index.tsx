import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import debounce from 'lodash/debounce'

import {
  COLORS,
  Icon,
  LegacyStyledText,
  Link,
  StyledText,
} from '@opentrons/components'

import logoSvgThree from '/app/assets/images/logo_nav_three.svg'
import logoSvg from '/app/assets/images/logo_nav.svg'

import styles from './navbar.module.css'

import type { MouseEvent } from 'react'
import type { RouteProps } from '../types'

const SALESFORCE_HELP_LINK = 'https://support.opentrons.com/s/'
const PROJECT: string = _OPENTRONS_PROJECT_
const DEBOUNCE_DURATION_MS = 300

export function Navbar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const { t } = useTranslation('top_navigation')
  const navigate = useNavigate()
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  const debouncedNavigate = useCallback(
    debounce((path: string) => {
      navigate(path)
    }, DEBOUNCE_DURATION_MS),
    [navigate]
  )

  return (
    <div className={styles.navbar}>
      <div className={styles.nav_container}>
        <div className={styles.nav_header_container}>
          <img
            src={PROJECT === 'ot3' ? logoSvgThree : logoSvg}
            alt="opentrons logo"
            className={styles.logo_img}
          />
          <StyledText color={COLORS.white} desktopStyle="bodyDefaultRegular">
            {t('ot2')}
          </StyledText>
        </div>
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavLink
            key={name}
            to={navLinkTo!}
            className={({ isActive }) =>
              `${styles.navbar_link} ${isActive ? 'active' : ''}`
            }
          >
            <LegacyStyledText forwardedAs="h3" className={styles.nav_link_text}>
              {t(name)}
            </LegacyStyledText>
          </NavLink>
        ))}
      </div>
      <div className={styles.bottom_container}>
        <Link
          role="button"
          data-testid="Navbar_settingsLink"
          className={styles.nav_icon_link}
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            debouncedNavigate('/app-settings')
          }}
        >
          <Icon name="gear" className={styles.navbar_icon} />
        </Link>
        <Link href={SALESFORCE_HELP_LINK} external className={styles.icon_link}>
          <Icon
            data-testid="Navbar_helpLink"
            name="help"
            className={styles.navbar_icon}
          />
        </Link>
      </div>
    </div>
  )
}
