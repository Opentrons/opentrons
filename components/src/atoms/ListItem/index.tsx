import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { FLEX_MAX_CONTENT } from '../../styles'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'

import type { ReactNode } from 'react'
import type { StyleProps } from '../../primitives'

export * from './ListItemChildren'

export type ListItemType =
  | 'error'
  | 'default'
  | 'success'
  | 'warning'
  | 'unavailable'
  | 'defaultOnColor'
  | 'successOnColor'
  | 'warningOnColor'
  | 'errorOnColor'

interface ListItemProps extends StyleProps {
  /** ListItem state type */
  type: ListItemType
  /** ListItem contents */
  children: ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const LISTITEM_PROPS_BY_TYPE: Record<
  ListItemType,
  { backgroundColor: string; color?: string }
> = {
  error: {
    backgroundColor: COLORS.red35,
  },
  default: {
    backgroundColor: COLORS.grey20,
  },
  success: {
    backgroundColor: COLORS.green35,
  },
  warning: {
    backgroundColor: COLORS.yellow35,
  },
  unavailable: {
    backgroundColor: COLORS.grey20,
    color: COLORS.grey40,
  },
  defaultOnColor: {
    backgroundColor: COLORS.white,
  },
  successOnColor: {
    backgroundColor: COLORS.green20,
  },
  warningOnColor: {
    backgroundColor: COLORS.yellow20,
  },
  errorOnColor: {
    backgroundColor: COLORS.red20,
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
    background-color: ${props.backgroundColor ?? listItemProps.backgroundColor};
    color: ${listItemProps.color ?? COLORS.black90};
    width: 100%;
    height: ${FLEX_MAX_CONTENT};
    border-radius: ${BORDERS.borderRadius8};
    padding: ${SPACING.spacing16} ${SPACING.spacing24};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
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
