import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import caret_right from '../../assets/images/caret_right.svg'

interface BreadcrumbsProps {
  crumbs: string[]
}

const Crumb = styled(Flex)`
  align-items: ${ALIGN_CENTER};
  color: ${COLORS.blue};
  padding-right: ${SPACING.spacing2};
  &:hover {
    opacity: 0.8;
  }
`

/**
 * a breadcrumb navigation bar
 * @param {string[]} crumbs an array of strings to render as breadcrumbs
 * @returns {JSX.Element}
 */
export function Breadcrumbs({ crumbs }: BreadcrumbsProps): JSX.Element | null {
  return crumbs.length > 1 ? (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      borderBottom={`1px solid ${COLORS.medGrey}`}
      css={TYPOGRAPHY.h6Default}
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing2} 0 ${SPACING.spacing2} ${SPACING.spacing3}`}
    >
      {crumbs.map((crumb, i) => {
        return i !== crumbs.length - 1 ? (
          <Link to={`/${crumbs.slice(0, i + 1).join('/')}`}>
            <Crumb>
              <Box paddingRight={SPACING.spacing2}>{crumb}</Box>
              <img src={caret_right} />
            </Crumb>
          </Link>
        ) : (
          <Box color={COLORS.darkGreyEnabled}>{crumb}</Box>
        )
      })}
    </Flex>
  ) : null
}
