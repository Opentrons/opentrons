import * as React from 'react'

import {
  BORDERS,
  COLORS,
  LEGACY_COLORS,
  Flex,
  SPACING,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

export type ListItemType = 'error' | 'noActive' | 'success' | 'warning'

interface ListItemProps extends StyleProps {
  /** ListItem state type */
  type: ListItemType
  /** ListItem contents */
  children: React.ReactNode
}

const LISTITEM_PROPS_BY_TYPE: Record<
  ListItemType,
  { backgroundColor: string }
> = {
  error: {
    backgroundColor: LEGACY_COLORS.red3,
  },
  noActive: {
    backgroundColor: COLORS.grey35,
  },
  success: {
    backgroundColor: COLORS.green35,
  },
  warning: {
    backgroundColor: LEGACY_COLORS.yellow3,
  },
}

export function ListItem(props: ListItemProps): JSX.Element {
  const { type, children, ...styleProps } = props
  const listItemProps = LISTITEM_PROPS_BY_TYPE[type]

  return (
    <Flex
      data-testid={`ListItem_${type}`}
      width="100%"
      height="max-content"
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      backgroundColor={listItemProps.backgroundColor}
      borderRadius={BORDERS.borderRadiusSize3}
      {...styleProps}
    >
      {children}
    </Flex>
  )
}
