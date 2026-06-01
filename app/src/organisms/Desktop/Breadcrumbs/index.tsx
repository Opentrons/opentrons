import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useLocation, useParams } from 'react-router-dom'
import clsx from 'clsx'

import { Icon } from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { getIsOnDevice } from '/app/redux/config'
import { OPENTRONS_USB } from '/app/redux/discovery'
import { getStoredProtocol } from '/app/redux/protocol-storage'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { appShellUSBRequestor } from '/app/redux/shell/remote'
import { useRunCreatedAtTimestamp } from '/app/resources/runs'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import styles from './breadcrumbs.module.css'

import type { DesktopRouteParams } from '/app/App/types'
import type { State } from '/app/redux/types'

interface CrumbNameProps {
  crumbName: string
  isLastCrumb: boolean
}

function CrumbName({ crumbName, isLastCrumb }: CrumbNameProps): JSX.Element {
  return (
    <div className={isLastCrumb ? styles.crumb_inactive : styles.crumb_active}>
      <div className={clsx(styles.crumb_name, styles.text_style)}>
        {crumbName}
      </div>
      {!isLastCrumb ? (
        <Icon name="caret-right" width="0.25rem" height="0.3125rem" />
      ) : null}
    </div>
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
      | string
      | null
      | { linkPath: string; crumbName: string | null }
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
              <CrumbName
                crumbName={crumb.crumbName}
                isLastCrumb={isLastCrumb}
              />
            </Link>
          </div>
        )
      })}
    </div>
  ) : null
}

export function Breadcrumbs(): JSX.Element | null {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  return (
    <ApiHostProvider
      hostname={robot?.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined}
      token={token}
    >
      <BreadcrumbsComponent />
    </ApiHostProvider>
  )
}
