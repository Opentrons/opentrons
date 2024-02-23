import * as React from 'react'
import { css } from 'styled-components'
import { TYPOGRAPHY, BORDERS, SPACING } from '../ui-style-constants'
import { COLORS } from '../helix-design-system'
import { POSITION_RELATIVE } from '../styles'
import { Btn } from '../primitives'

const defaultTabStyle = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.black90};
  background-color: ${COLORS.purple30};
  border: 0px ${BORDERS.styleSolid} ${COLORS.purple30};
  border-radius: ${BORDERS.borderRadiusSize2};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  position: ${POSITION_RELATIVE};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &:focus-visible {
    outline: 2px ${BORDERS.styleSolid} ${COLORS.yellow50};
  }
`

const currentTabStyle = css`
  ${defaultTabStyle}
  color: ${COLORS.white};
  background-color: ${COLORS.purple50};

  &:hover {
    background-color: ${COLORS.purple55};
  }
`

const disabledTabStyle = css`
  ${defaultTabStyle}
  background-color: ${COLORS.grey30};
  color: ${COLORS.grey40};
`

interface RoundTabProps extends React.ComponentProps<typeof Btn> {
  isCurrent: boolean
  disabled?: boolean
}
export function RoundTab({
  isCurrent,
  children,
  disabled = false,
  ...restProps
}: RoundTabProps): JSX.Element {
  let tabStyle = defaultTabStyle
  if (disabled) tabStyle = disabledTabStyle
  else if (isCurrent) tabStyle = currentTabStyle

  return (
    <Btn {...restProps} css={tabStyle}>
      {children}
    </Btn>
  )
}
