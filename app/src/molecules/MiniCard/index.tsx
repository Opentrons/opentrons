import * as React from 'react'
import { css } from 'styled-components'

import {
  Icon,
  SPACING,
  Flex,
  COLORS,
  BORDERS,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

interface MiniCardProps {
  onClick: () => void
  isSelected: boolean
  isError: boolean
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
  const { children, onClick, isSelected, isError } = props
  return (
    <Flex
      position={POSITION_RELATIVE}
      onClick={onClick}
      css={
        isError && isSelected
          ? errorOptionStyles
          : isSelected
          ? selectedOptionStyles
          : unselectedOptionStyles
      }
    >
      {isError && isSelected && (
        <Icon
          name="alert-circle"
          color={COLORS.error}
          position={POSITION_ABSOLUTE}
          width={SPACING.spacing4}
          top={SPACING.spacing3}
          right={SPACING.spacing3}
          aria-label={`icon_error`}
        />
      )}
      {children}
    </Flex>
  )
}
