import * as React from 'react'
import { COLORS, Flex, POSITION_FIXED } from '@opentrons/components'

export interface BackgroundOverlayProps
  extends React.ComponentProps<typeof Flex> {
  //  onClick handler so when you click anywhere in the overlay, the modal/menu closes
  onClick: React.MouseEventHandler
}

export function BackgroundOverlay(props: BackgroundOverlayProps): JSX.Element {
  const { onClick, ...flexProps } = props

  return (
    <Flex
      aria-label="BackgroundOverlay"
      position={POSITION_FIXED}
      left="0"
      right="0"
      top="0"
      bottom="0"
      zIndex="3"
      backgroundColor={`${COLORS.black90}${COLORS.opacity60HexCode}`}
      onClick={onClick}
      {...flexProps}
    />
  )
}
