import * as React from 'react'
import { useSelector } from 'react-redux'
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
import { getStoredProtocol } from '../../redux/protocol-storage'
import { usePathCrumbs } from './hooks'
import { getLinkPath } from './utils'

import type { NavRouteParams } from '../../App/types'
import type { State } from '../../redux/types'

interface CrumbNameProps {
  crumbName: string
  isLastCrumb: boolean
}

function CrumbName({ crumbName, isLastCrumb }: CrumbNameProps): JSX.Element {
  const { protocolKey, runId } = useParams<NavRouteParams>()

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

  /**
   * To display breadcrumb segments as param-based data rather than the params themselves,
   * we can index the desired display names by the params pulled from the matched route
   */
  const crumbDisplayNameByParam: { [k: string]: string } = {
    [protocolKey]: protocolDisplayName,
    [runId]: runCreatedAtTimestamp,
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      color={isLastCrumb ? COLORS.darkGreyEnabled : COLORS.blueEnabled}
    >
      <Box
        paddingRight={SPACING.spacing2}
        textTransform={TYPOGRAPHY.textTransformNone}
        css={TYPOGRAPHY.labelRegular}
      >
        {crumbDisplayNameByParam[crumbName] ?? crumbName}
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

export function Breadcrumbs(): JSX.Element | null {
  const { robotName } = useParams<NavRouteParams>()
  const robot = useRobot(robotName)
  const pathCrumbs = usePathCrumbs()

  return pathCrumbs.length > 1 ? (
    <ApiHostProvider hostname={robot?.ip ?? null}>
      <Flex
        alignItems={ALIGN_FLEX_START}
        backgroundColor={COLORS.white}
        borderBottom={`1px solid ${COLORS.medGreyEnabled}`}
        css={TYPOGRAPHY.labelRegular}
        flexDirection={DIRECTION_ROW}
        padding={`${SPACING.spacing2} 0 ${SPACING.spacing2} ${SPACING.spacing3}`}
      >
        {pathCrumbs.map((crumb, i) => {
          const linkPath = getLinkPath(pathCrumbs, i)
          const isLastCrumb = i === pathCrumbs.length - 1

          return (
            <Flex key={crumb.pathSegment} paddingRight={SPACING.spacing2}>
              <CrumbLink
                as={!isLastCrumb ? CrumbLink : CrumbLinkInactive}
                to={linkPath}
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
    </ApiHostProvider>
  ) : null
}
