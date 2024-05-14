import * as React from 'react'
import { COLORS, Icon, RESPONSIVENESS } from "@opentrons/components"
import { ODD_FOCUS_VISIBLE } from "./constants"
import styled from "styled-components"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: React.ComponentProps<typeof Icon>['name']
}

export function IconButton(props: IconButtonProps) {
  const { iconName, ...buttonProps } = props
  return (
    <ButtonWrapper {...buttonProps}>
      <Icon size="5rem" name={iconName} />
    </ButtonWrapper>
  )
}

const ButtonWrapper = styled('button')`
  border-radius: 50%;
  max-height: 100%;
  background-color: ${COLORS.white};

  &:active {
    background-color: ${COLORS.grey35};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.grey35};
  }
  &:disabled {
    background-color: transparent;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: default;
  }
`
