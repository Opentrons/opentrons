import * as React from 'react'
import { css } from 'styled-components'

import {
  COLORS,
  Flex,
  POSITION_FIXED,
  RESPONSIVENESS,
} from '@opentrons/components'

const BACKGROUND_OVERLAY_STYLE = css`
  position: ${POSITION_FIXED};
  inset: 0;
  z-index: 3;
  aria-label: 'BackgroundOverlay';
  background-color: ${COLORS.black90}${COLORS.opacity40HexCode};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.black90}${COLORS.opacity60HexCode};
  }
`

export interface BackgroundOverlayProps
  extends React.ComponentProps<typeof Flex> {
  //  onClick handler so when you click anywhere in the overlay, the modal/menu closes
  onClick: React.MouseEventHandler
}

export function BackgroundOverlay(props: BackgroundOverlayProps): JSX.Element {
  const { onClick, ...flexProps } = props

  return (
    <Flex css={BACKGROUND_OVERLAY_STYLE} onClick={onClick} {...flexProps} />
  )
}
