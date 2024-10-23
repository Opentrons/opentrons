import type * as React from 'react'
import { css } from 'styled-components'
import { Flex } from '../../primitives'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'
import { BORDERS, COLORS } from '../../helix-design-system'
import { FLEX_MAX_CONTENT } from '../../styles'
import type { StyleProps } from '../../primitives'

export * from './ListItemChildren'

export type ListItemType = 'error' | 'noActive' | 'success' | 'warning'

interface ListItemProps extends StyleProps {
  /** ListItem state type */
  type: ListItemType
  /** ListItem contents */
  children: React.ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const LISTITEM_PROPS_BY_TYPE: Record<
  ListItemType,
  { backgroundColor: string }
> = {
  error: {
    backgroundColor: COLORS.red35,
  },
  noActive: {
    backgroundColor: COLORS.grey30,
  },
  success: {
    backgroundColor: COLORS.green35,
  },
  warning: {
    backgroundColor: COLORS.yellow35,
  },
}

/*
  ListItem is used in ODD and helix
**/
export function ListItem(props: ListItemProps): JSX.Element {
  const {
    type,
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...styleProps
  } = props
  const listItemProps = LISTITEM_PROPS_BY_TYPE[type]

  const LIST_ITEM_STYLE = css`
    background-color: ${listItemProps.backgroundColor};
    width: 100%;
    height: ${FLEX_MAX_CONTENT};
    border-radius: ${BORDERS.borderRadius4};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding: ${SPACING.spacing16} ${SPACING.spacing24};
      border-radius: ${BORDERS.borderRadius12};
    }
  `

  return (
    <Flex
      data-testid={`ListItem_${type}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      css={LIST_ITEM_STYLE}
      {...styleProps}
    >
      {children}
    </Flex>
  )
}
