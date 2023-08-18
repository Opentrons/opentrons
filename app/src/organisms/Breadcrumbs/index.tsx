import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  Icon,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import {
  useRobot,
  useRunCreatedAtTimestamp,
} from '../../organisms/Devices/hooks'
import { getProtocolDisplayName } from '../../organisms/ProtocolsLanding/utils'
import { getIsOnDevice } from '../../redux/config'
import { OPENTRONS_USB } from '../../redux/discovery'
import { getStoredProtocol } from '../../redux/protocol-storage'
import { appShellRequestor } from '../../redux/shell/remote'

import type { DesktopRouteParams } from '../../App/types'
import type { State } from '../../redux/types'

interface CrumbNameProps {
  crumbName: string
  isLastCrumb: boolean
}

function CrumbName({ crumbName, isLastCrumb }: CrumbNameProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      color={isLastCrumb ? COLORS.darkGreyEnabled : COLORS.blueEnabled}
    >
      <Box
        paddingRight={SPACING.spacing4}
        textTransform={TYPOGRAPHY.textTransformNone}
        css={TYPOGRAPHY.labelRegular}
      >
        {crumbName}
      </Box>
      {!isLastCrumb ? (
        <Icon name="caret-right" width="0.25rem" height="0.3125rem" />
      ) : null}
    </Flex>
  )
}

const CrumbLink = styled(Link)`
  &:hover {
    opacity: 0.8;
  }
`

const CrumbLinkInactive = styled(Flex)`
  &:hover {
    opacity: 1;
  }
`

function BreadcrumbsComponent(): JSX.Element | null {
  const { t } = useTranslation('top_navigation')
  const isOnDevice = useSelector(getIsOnDevice)
  const { protocolKey, robotName, runId } = useParams<DesktopRouteParams>()

  const runCreatedAtTimestamp = useRunCreatedAtTimestamp(runId)

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
  const crumbNameByPath: { [index: string]: string | null } = {
    '/devices': !(isOnDevice ?? false) ? t('devices') : null,
    [`/devices/${robotName}`]: robotName,
    [`/devices/${robotName}/robot-settings`]: t('robot_settings'),
    [`/devices/${robotName}/protocol-runs/${runId}`]: runCreatedAtTimestamp,

    '/protocols': t('protocols'),
    [`/protocols/${protocolKey}`]: protocolDisplayName,
  }

  // create an array of crumbs based on the pathname and defined names by path
  const { pathname } = useLocation()
  const pathArray = pathname.split('/')

  const pathCrumbs = pathArray.flatMap((_, i) => {
    const linkPath = pathArray.slice(0, i + 1).join('/')
    const crumbName = crumbNameByPath[linkPath]

    // filter out null or undefined crumb names
    return crumbName != null
      ? [
          {
            linkPath,
            crumbName,
          },
        ]
      : []
  })

  return pathCrumbs.length > 1 ? (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      borderBottom={`1px solid ${String(COLORS.medGreyEnabled)}`}
      css={TYPOGRAPHY.labelRegular}
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing4} 0 ${SPACING.spacing4} ${SPACING.spacing8}`}
    >
      {pathCrumbs.map((crumb, i) => {
        const isLastCrumb = i === pathCrumbs.length - 1

        return (
          <Flex key={crumb.linkPath} paddingRight={SPACING.spacing4}>
            <CrumbLink
              as={!isLastCrumb ? CrumbLink : CrumbLinkInactive}
              to={crumb.linkPath}
            >
              <CrumbName
                crumbName={crumb.crumbName}
                isLastCrumb={isLastCrumb}
              />
            </CrumbLink>
          </Flex>
        )
      })}
    </Flex>
  ) : null
}

export function Breadcrumbs(): JSX.Element | null {
  const { robotName } = useParams<DesktopRouteParams>()
  const robot = useRobot(robotName)

  return (
    <ApiHostProvider
      hostname={robot?.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
      <BreadcrumbsComponent />
    </ApiHostProvider>
  )
}
