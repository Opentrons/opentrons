import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import debounce from 'lodash/debounce'

import { Icon, LegacyStyledText, Link } from '@opentrons/components'

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
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedNavigate = useCallback(
    debounce((path: string) => {
      navigate(path)
    }, DEBOUNCE_DURATION_MS),
    [navigate]
  )

  return (
    <div className={styles.navbar}>
      <div className={styles.nav_container}>
        <img
          src={PROJECT === 'ot3' ? logoSvgThree : logoSvg}
          alt={t('opentrons_logo')}
          className={styles.logo_img}
        />
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
          className={styles.nav_icon_link}
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            debouncedNavigate('/app-settings')
          }}
          aria-label={t('app_settings')}
        >
          <Icon
            name="gear"
            aria-label={t('settings_icon')}
            className={styles.navbar_icon}
          />
        </Link>
        <Link
          href={SALESFORCE_HELP_LINK}
          external
          className={styles.icon_link}
          aria-label={t('help')}
        >
          <Icon
            name="help"
            aria-label={t('help_icon')}
            className={styles.navbar_icon}
          />
        </Link>
      </div>
    </div>
  )
}
