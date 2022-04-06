import * as React from 'react'
import { COLORS, Flex, POSITION_ABSOLUTE } from '..'

export interface OverlayProps {
  /** optional onClick handler */
  onClick?: React.MouseEventHandler
  alertOverlay?: boolean | null | undefined
  backgroundColor?: string
}

export function Overlay(props: OverlayProps): JSX.Element {
  const { alertOverlay, onClick } = props

  let backgroundColor: string = COLORS.darkBlack + '59'
  if (alertOverlay === true) {
    backgroundColor = 'rgba(115, 115, 115, 0.9)'
  } else if (props.backgroundColor != null) {
    backgroundColor = props.backgroundColor
  }

  return (
    <Flex
      position={POSITION_ABSOLUTE}
      left="0"
      right="0"
      top="0"
      bottom="0"
      zIndex="1"
      backgroundColor={backgroundColor}
      onClick={onClick}
    />
  )
}
