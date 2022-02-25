import * as React from 'react'
import { Flex, POSITION_ABSOLUTE } from '..'

export interface OverlayProps {
  /** optional onClick handler */
  onClick?: React.MouseEventHandler
  alertOverlay?: boolean | null | undefined
  backgroundColor?: string
}

export function Overlay(props: OverlayProps): JSX.Element {
  const { alertOverlay, onClick } = props

  let backgroundColor: string = 'rgba(22, 33, 45, 0.2)'
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
      backgroundColor={backgroundColor}
      onClick={onClick}
    />
  )
}
