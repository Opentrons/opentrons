import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { CURSOR_DEFAULT, CURSOR_POINTER } from '../../styles'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { MouseEvent, ReactNode } from 'react'
import type { StyleProps } from '../../primitives'

export * from './ListButtonChildren/index'

type ListButtonType =
  'noActive' | 'connected' | 'notConnected' | 'onColor' | 'error'

interface ListButtonProps extends StyleProps {
  /** ListButton type */
  type: ListButtonType
  /** ListButton content */
  children: ReactNode
  /** ListButton disabled state */
  disabled?: boolean
  /** ListButton onClick event */
  onClick?: () => void
  /** optional data-testid value for testing */
  testId?: string
}

const DESKTOP_LIST_BUTTON_PROPS_BY_TYPE: Record<
  ListButtonType,
  { backgroundColor: string; hoverBackgroundColor: string }
> = {
  noActive: {
    backgroundColor: COLORS.grey20,
    hoverBackgroundColor: COLORS.grey30,
  },
  connected: {
    backgroundColor: COLORS.green30,
    hoverBackgroundColor: COLORS.green35,
  },
  notConnected: {
    backgroundColor: COLORS.yellow30,
    hoverBackgroundColor: COLORS.yellow35,
  },
  onColor: {
    backgroundColor: COLORS.white,
    hoverBackgroundColor: COLORS.grey10,
  },
  error: {
    backgroundColor: COLORS.red30,
    hoverBackgroundColor: COLORS.red35,
  },
}

const ODD_LIST_BUTTON_PROPS_BY_TYPE: Record<
  ListButtonType,
  { backgroundColor: string; hoverBackgroundColor: string }
> = {
  noActive: {
    backgroundColor: COLORS.grey35,
    hoverBackgroundColor: COLORS.grey40,
  },
  connected: {
    backgroundColor: COLORS.green35,
    hoverBackgroundColor: COLORS.green40,
  },
  notConnected: {
    backgroundColor: COLORS.yellow35,
    hoverBackgroundColor: COLORS.yellow40,
  },
  onColor: {
    backgroundColor: COLORS.white,
    hoverBackgroundColor: COLORS.grey20,
  },
  error: {
    backgroundColor: COLORS.red35,
    hoverBackgroundColor: COLORS.red40,
  },
}

/*
  ListButton is used in helix 
  TODO(ja, 8/12/24): shuld be used in ODD as well and need to add
  odd stylings
**/
export function ListButton(props: ListButtonProps): JSX.Element {
  const {
    type,
    children,
    disabled = false,
    onClick,
    testId,
    ...styleProps
  } = props
  const desktopListButtonProps = DESKTOP_LIST_BUTTON_PROPS_BY_TYPE[type]
  const oddListButtonProps = ODD_LIST_BUTTON_PROPS_BY_TYPE[type]

  return (
    <Flex
      data-testid={testId ?? `ListButton_${type}`}
      onClick={(e: MouseEvent) => {
        onClick?.()
        e.stopPropagation()
      }}
      css={LIST_BUTTON_STYLE(
        disabled,
        styleProps,
        desktopListButtonProps,
        oddListButtonProps
      )}
      tabIndex={0}
      max-width="26.875rem"
      {...styleProps}
    >
      {children}
    </Flex>
  )
}

const LIST_BUTTON_STYLE = (
  disabled: boolean,
  styleProps: StyleProps,
  desktopListButtonProps: Record<string, string>,
  oddListButtonProps: Record<string, string>
): FlattenSimpleInterpolation => css`
  cursor: ${disabled ? CURSOR_DEFAULT : CURSOR_POINTER};
  background-color: ${
    disabled ? COLORS.grey20 : desktopListButtonProps.backgroundColor
  };
  padding: ${styleProps.padding ?? `${SPACING.spacing20} ${SPACING.spacing24}`};
  border-radius: ${BORDERS.borderRadius8};

  &:hover {
    background-color: ${
      disabled ? COLORS.grey20 : desktopListButtonProps.hoverBackgroundColor
    };
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.blue50};
    outline-offset: 0.125rem;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${
      disabled ? COLORS.grey35 : oddListButtonProps.backgroundColor
    };

    &:hover {
      background-color: ${
        disabled ? COLORS.grey35 : oddListButtonProps.hoverBackgroundColor
      };
    }
  }
`
