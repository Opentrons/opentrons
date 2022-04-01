import * as React from 'react'
import { Link } from 'react-router-dom'
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

export interface PathCrumb {
  pathSegment: string
  crumbName: string
}

interface BreadcrumbsProps {
  pathCrumbs: PathCrumb[]
}

const Crumb = styled(Flex)`
  align-items: ${ALIGN_CENTER};
  color: ${COLORS.blue};
  padding-right: ${SPACING.spacing2};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  &:hover {
    opacity: 0.8;
  }
`

/**
 * a breadcrumb navigation bar
 * @param {PathCrumb[]} pathCrumbs an array of names/path segments to render as breadcrumbs
 * @returns {JSX.Element}
 */
export function Breadcrumbs({
  pathCrumbs,
}: BreadcrumbsProps): JSX.Element | null {
  return pathCrumbs.length > 1 ? (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      borderBottom={`1px solid ${COLORS.medGrey}`}
      css={TYPOGRAPHY.h6Default}
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing2} 0 ${SPACING.spacing2} ${SPACING.spacing3}`}
    >
      {pathCrumbs.map((crumb, i) => {
        const linkPath = `/${pathCrumbs
          // use all crumbs up to the current crumb
          .slice(0, i + 1)
          // construct path with original path segment
          .map(crumb => crumb.pathSegment)
          .join('/')}`

        return i !== pathCrumbs.length - 1 ? (
          <Link key={crumb.pathSegment} to={linkPath}>
            <Crumb>
              <Box paddingRight={SPACING.spacing2}>{crumb.crumbName}</Box>
              <Icon name="caret-right" width="0.25rem" height="0.3125rem" />
            </Crumb>
          </Link>
        ) : (
          <Box
            key={crumb.pathSegment}
            color={COLORS.darkGreyEnabled}
            textTransform={TYPOGRAPHY.textTransformNone}
          >
            {crumb.crumbName}
          </Box>
        )
      })}
    </Flex>
  ) : null
}
