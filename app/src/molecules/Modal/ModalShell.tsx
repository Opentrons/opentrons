import * as React from 'react'
import styled from 'styled-components'
import {
  Box,
  StyleProps,
  COLORS,
  SPACING,
  POSITION_FIXED,
  POSITION_ABSOLUTE,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_AUTO,
  POSITION_STICKY,
  BORDERS,
  RESPONSIVENESS,
  styleProps,
} from '@opentrons/components'

const HEADER_STYLE = {
  backgroundColor: COLORS.white,
  position: POSITION_STICKY,
  top: 0,
} as const

const FOOTER_STYLE = {
  backgroundColor: COLORS.white,
  position: POSITION_STICKY,
  bottom: 0,
  boxShadow: '0px 3px 6px 0px #0000003B',
} as const

export interface ModalShellProps extends StyleProps {
  /** Optional close on outside click **/
  onOutsideClick?: React.MouseEventHandler
  /** Optional sticky header */
  header?: React.ReactNode
  /** Optional sticky footer */
  footer?: React.ReactNode
  /** Optional full page takeover */
  fullPage?: boolean
  /** Modal content */
  children: React.ReactNode
}

/**
 * A ModalShell is a layout component for building more specific modals.
 *
 * It includes:
 * - An overlay
 * - A content area, with `overflow-y: auto` and customizable with style props
 * - An optional sticky header
 * - An optional sticky footer
 * - An optional onOutsideClick function
 */
export function ModalShell(props: ModalShellProps): JSX.Element {
  const {
    onOutsideClick,
    zIndex = 10,
    header,
    footer,
    fullPage = false,
    children,
    ...styleProps
  } = props

  return (
    <Overlay
      onClick={e => {
        e.stopPropagation()
        if (onOutsideClick != null) onOutsideClick(e)
      }}
    >
      <ContentArea zIndex={zIndex}>
        <ModalArea
          isFullPage={fullPage}
          onClick={e => { e.stopPropagation() }}
          {...styleProps}
        >
          {header != null ? <Box {...HEADER_STYLE}>{header}</Box> : null}
          {children}
          {footer != null ? <Box {...FOOTER_STYLE}>{footer}</Box> : null}
        </ModalArea>
      </ContentArea>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: ${POSITION_FIXED};
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
  background-color: ${COLORS.backgroundOverlay};
  cursor: default
`
const ContentArea = styled.div<{ zIndex: string | number }>`
  display: flex;
  position: ${POSITION_ABSOLUTE};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`

const ModalArea = styled.div<{ isFullPage: boolean, backgroundColor?: string} & StyleProps>`
  backgroundColor: ${COLORS.white};
  position: ${POSITION_RELATIVE};
  overflowY: ${OVERFLOW_AUTO};
  maxHeight: 100%;
  width: 100%;
  margin: ${SPACING.spacing5};
  border-radius: ${BORDERS.radiusSoftCorners};
  box-shadow: ${BORDERS.smallDropShadow};
  height: ${({isFullPage}) => isFullPage ? '100%' : 'auto'};
  background-color: ${COLORS.white};
  ${styleProps};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {

  }
`