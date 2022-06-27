import * as React from 'react'
import { css } from 'styled-components'

import { SPACING, Flex, COLORS, BORDERS } from '@opentrons/components'

interface MiniCardProps {
  onClick: () => void
  isSelected: boolean
  error?: string | null
  children: React.ReactNode
}
const unselectedOptionStyles = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGrey};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  margin-bottom: ${SPACING.spacing3};
  width: 100%;
  cursor: pointer;

  &:hover {
    background-color: ${COLORS.background};
    border: 1px solid ${COLORS.medGreyHover};
  }
`
const selectedOptionStyles = css`
  ${unselectedOptionStyles}
  border: 1px solid ${COLORS.blue};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blue};
    background-color: ${COLORS.lightBlue};
  }
`

const errorOptionStyles = css`
  ${unselectedOptionStyles}
  border: 1px solid ${COLORS.error};
  background-color: ${COLORS.errorBg};

  &:hover {
    border: 1px solid ${COLORS.error};
    background-color: ${COLORS.errorBg};
  }
`

export function MiniCard(props: MiniCardProps): JSX.Element {
  const { children, onClick, isSelected, error } = props
  return (
    <Flex
      onClick={onClick}
      css={
        error != null && isSelected
          ? errorOptionStyles
          : isSelected
          ? selectedOptionStyles
          : unselectedOptionStyles
      }
    >
      {children}
    </Flex>
  )
}
