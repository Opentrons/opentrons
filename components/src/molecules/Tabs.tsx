import * as React from 'react'
import { css } from 'styled-components'
import { TYPOGRAPHY, SPACING } from '../ui-style-constants'
import { COLORS, BORDERS } from '../helix-design-system'
import { POSITION_RELATIVE, DIRECTION_COLUMN, DIRECTION_ROW } from '../styles'
import { Flex } from '../primitives'

const defaultTabStyle = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.black90};
  background-color: ${COLORS.purple30};
  border: 0px ${BORDERS.styleSolid} ${COLORS.purple30};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  position: ${POSITION_RELATIVE};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &:focus-visible {
    outline-offset: 2px;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
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

export interface TabsProps {
  buttons: Array<{
    text: string
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
  }>
}

export function Tabs(props: TabsProps): JSX.Element {
  const { buttons } = props

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      padding={SPACING.spacing16}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={() => {
              button.onClick()
            }}
            css={button.isActive === true ? currentTabStyle : defaultTabStyle}
            disabled={button.disabled}
          >
            {button.text}
          </button>
        ))}
      </Flex>
    </Flex>
  )
}
