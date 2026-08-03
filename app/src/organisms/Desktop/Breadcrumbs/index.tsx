import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useParams } from 'react-router-dom'
import clsx from 'clsx'

import {
  BasicButton,
  Icon,
  MenuItem,
  MenuList,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { AccountIconButton } from '/app/atoms/buttons/AccountIconButton'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { showLoginModal } from '/app/organisms/Desktop/LoginModal'
import { getIsOnDevice } from '/app/redux/config'
import { getStoredProtocol } from '/app/redux/protocol-storage'
import { logOut } from '/app/redux/robot-auth'
import { useAccountIconInitial } from '/app/resources/access-control/useAccountIconInitial'
import { useRunCreatedAtTimestamp } from '/app/resources/runs'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import styles from './breadcrumbs.module.css'

import type { ComponentProps } from 'react'
import type { DesktopRouteParams } from '/app/App/types'
import type { State } from '/app/redux/types'

interface CrumbAndSeparatorProps {
  crumbName: string
  isLastCrumb: boolean
}

function CrumbAndSeparator({
  crumbName,
  isLastCrumb,
}: CrumbAndSeparatorProps): JSX.Element {
  return (
    <div
      className={clsx(
        styles.crumb_and_separator,
        isLastCrumb ? styles.crumb_inactive : styles.crumb_active
      )}
    >
      <StyledText className={styles.text_style} desktopStyle="captionRegular">
        {crumbName}
      </StyledText>
      {!isLastCrumb ? (
        <Icon
          className={styles.separator}
          name="caret-right"
          width="0.25rem"
          height="0.3125rem"
        />
      ) : null}
    </div>
  )
}

interface AccountSectionProps {
  robotName: string
}

function AccountSection({
  robotName,
}: AccountSectionProps): JSX.Element | null {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data.accessControlEnabled ?? false
  const accountIconInfo = useAccountIconInitial(robotName)
  if (accessControlEnabled) {
    if (accountIconInfo.showIcon) {
      return (
        <div className={styles.right_container}>
          <AccountIconAndMenu
            initial={accountIconInfo.iconContents}
            robotName={robotName}
          />
        </div>
      )
    } else {
      return (
        <div className={styles.right_container}>
          <LoginLink robotName={robotName} />
        </div>
      )
    }
  } else {
    return null
  }
}

interface AccountIconAndMenuProps {
  initial: ComponentProps<typeof AccountIconButton>['initial']
  robotName: string
}

function AccountIconAndMenu(props: AccountIconAndMenuProps): JSX.Element {
  const { initial, robotName } = props
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const onClickOutside = useCallback(() => {
    setIsMenuOpen(false)
  }, [])
  const menuContainerRef = useOnClickOutside<HTMLDivElement>({ onClickOutside })

  const dispatch = useDispatch()
  const { t } = useTranslation('top_navigation')

  return (
    <div
      ref={menuContainerRef}
      className={styles.account_popover_menu_container}
    >
      <AccountIconButton
        initial={initial}
        onClick={() => {
          setIsMenuOpen(current => !current)
        }}
      />
      {isMenuOpen ? (
        // todo(mm, 2026-05-28): This MenuList is rendering too far away from the button.
        // MenuList hard-codes an offset that's wrong here (and perhaps wrong everywhere),
        // and doesn't give us a way to override it.
        <MenuList>
          <Link to={`/devices/${robotName}/robot-settings/compliance-ready`}>
            <MenuItem
              onClick={() => {
                setIsMenuOpen(false)
              }}
            >
              {t('account_settings')}
            </MenuItem>
          </Link>
          <MenuItem
            onClick={() => {
              dispatch(logOut({ robotName }))
            }}
          >
            {t('log_out')}
          </MenuItem>
        </MenuList>
      ) : null}
    </div>
  )
}

interface LoginLinkProps {
  robotName: string
}

function LoginLink({ robotName }: LoginLinkProps): JSX.Element {
  const { t } = useTranslation('top_navigation')
  const handleClick = useCallback(() => {
    if (robotName == null) {
      console.error("Couldn't determine the robot to log in to.")
    } else {
      showLoginModal({ robotName })
    }
  }, [robotName])

  return (
    <BasicButton type="button" onClick={handleClick} underLine>
      {t('log_in')}
    </BasicButton>
  )
}

function BreadcrumbsComponent(): JSX.Element | null {
  const { t } = useTranslation('top_navigation')
  const isOnDevice = useSelector(getIsOnDevice)
  const { protocolKey, robotName, runId, runCreatedAtTimestamp } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const runCreatedAtTimestampFromHook = useRunCreatedAtTimestamp(runId)

  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )
  const protocolDisplayName =
    storedProtocol != null
      ? getProtocolDisplayName(
          storedProtocol.protocolKey,
          storedProtocol.srcFileNames,
          storedProtocol.mostRecentAnalysis
        )
      : protocolKey

  // determines whether a crumb is displayed for a path, and the displayed name
  const crumbNameByPath: {
    [index: string]:
      string | null | { linkPath: string; crumbName: string | null }
  } = {
    '/devices': !(isOnDevice ?? false) ? t('devices') : null,
    [`/devices/${robotName}`]: robotName,
    [`/devices/${robotName}/robot-settings`]: t('robot_settings'),
    [`/devices/${robotName}/protocol-runs/${runId}`]:
      runCreatedAtTimestampFromHook,

    // for protocol visualization path from protocol setup page and back to protocol setup page
    [`/devices/${robotName}/${runId}/${encodeURIComponent(
      runCreatedAtTimestamp || ''
    )}`]: {
      linkPath: `/devices/${robotName}/protocol-runs/${runId}/setup`,
      crumbName: runCreatedAtTimestamp
        ? decodeURIComponent(runCreatedAtTimestamp)
        : null,
    },
    [`/devices/${robotName}/${runId}/${encodeURIComponent(
      runCreatedAtTimestamp || ''
    )}/${protocolKey}/visualization`]: t('visualization'),

    '/protocols': t('protocols'),
    [`/protocols/${protocolKey}`]: protocolDisplayName,
    [`/protocols/${protocolKey}/visualization`]: t('visualization'),
  }

  // create an array of crumbs based on the pathname and defined names by path
  const { pathname } = useLocation()
  const pathArray = pathname.split('/')

  const pathCrumbs = pathArray.flatMap((_, i) => {
    const linkPath = pathArray.slice(0, i + 1).join('/')
    const crumbConfig = crumbNameByPath[linkPath]

    let crumbName: string | null = null
    let actualLinkPath: string = linkPath

    if (
      typeof crumbConfig === 'object' &&
      crumbConfig !== null &&
      'linkPath' in crumbConfig
    ) {
      crumbName = crumbConfig.crumbName
      actualLinkPath = crumbConfig.linkPath
    } else if (typeof crumbConfig === 'string' || crumbConfig === null) {
      crumbName = crumbConfig
      actualLinkPath = linkPath
    }

    // filter out null or undefined crumb names
    return crumbName != null
      ? [
          {
            linkPath: actualLinkPath,
            crumbName,
          },
        ]
      : []
  })

  return pathCrumbs.length > 1 ? (
    <div className={styles.root_container}>
      <div className={styles.left_container}>
        {pathCrumbs.map((crumb, i) => {
          const isLastCrumb = i === pathCrumbs.length - 1

          return (
            <div className={styles.crumb_container} key={crumb.linkPath}>
              <Link
                className={
                  isLastCrumb ? styles.crumb_link_inactive : styles.crumb_link
                }
                to={crumb.linkPath}
              >
                <CrumbAndSeparator
                  crumbName={crumb.crumbName}
                  isLastCrumb={isLastCrumb}
                />
              </Link>
            </div>
          )
        })}
      </div>
      <AccountSection robotName={robotName} />
    </div>
  ) : null
}

export function Breadcrumbs(): JSX.Element | null {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams

  return (
    <ApiHostProvider robotName={robotName}>
      <BreadcrumbsComponent />
    </ApiHostProvider>
  )
}
