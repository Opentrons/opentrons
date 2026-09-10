import styled from 'styled-components'

import { BORDERS, COLORS } from '../helix-design-system'
import { styleProps } from '../primitives'
import {
  ALIGN_CENTER,
  ALIGN_END,
  CURSOR_DEFAULT,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  FLEX_AUTO,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  OVERFLOW_AUTO,
  OVERFLOW_HIDDEN,
  OVERFLOW_VISIBLE,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
} from '../styles'
import { RESPONSIVENESS, SPACING } from '../ui-style-constants'

import type { MouseEvent, MouseEventHandler, ReactNode } from 'react'
import type { StyleProps } from '../primitives'

export type Position = 'center' | 'bottomRight'
export interface ModalShellProps extends StyleProps {
  /** Modal content */
  children: ReactNode
  /** Optional close on outside click **/
  onOutsideClick?: MouseEventHandler
  /** Optional header */
  header?: ReactNode
  /** Optional footer */
  footer?: ReactNode
  /** Optional full page takeover */
  fullPage?: boolean
  /** Optional zIndex for the overlay */
  zIndexOverlay?: number
  /** Optional position to make the modal appear at the center or bottom right */
  position?: Position
  /** Optional visible overlay */
  showOverlay?: boolean
  /** Optional remove padding */
  noPadding?: boolean
}

/**
 * A ModalShell is a layout component for building more specific modals.
 *
 * It includes:
 * - An overlay
 * - A shell clipped to border-radius (overflow: hidden) so corners stay rounded
 * - A content area that scrolls independently of the header and footer
 * - An optional header
 * - An optional footer
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
    zIndexOverlay = 1,
    position = 'center',
    showOverlay = true,
    noPadding = false,
    ...styleProps
  } = props

  // Keep nested clipping off when a caller opts into overflow: visible
  // (ex, dropdown menus that must extend outside the modal).
  const allowOverflow =
    styleProps.overflow === OVERFLOW_VISIBLE ||
    styleProps.overflowY === OVERFLOW_VISIBLE

  return (
    <Overlay
      showOverlay={showOverlay}
      zIndex={zIndexOverlay}
      aria-label="BackgroundOverlay_ModalShell"
      onClick={(e: MouseEvent) => {
        e.stopPropagation()
        if (onOutsideClick != null) onOutsideClick(e)
      }}
    >
      <ContentArea zIndex={zIndex} position={position} noPadding={noPadding}>
        <ModalArea
          aria-label="ModalShell_ModalArea"
          role="dialog"
          aria-modal="true"
          isFullPage={fullPage}
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
          }}
          {...styleProps}
        >
          {header != null ? <Header>{header}</Header> : null}
          <ModalBody allowOverflow={allowOverflow}>{children}</ModalBody>
          {footer != null ? <Footer>{footer}</Footer> : null}
        </ModalArea>
      </ContentArea>
    </Overlay>
  )
}
const Overlay = styled.div<{ zIndex: string | number; showOverlay: boolean }>`
  position: ${POSITION_ABSOLUTE};
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: ${({ zIndex }) => zIndex};
  background-color: ${({ showOverlay }) =>
    showOverlay
      ? `${COLORS.black90}${COLORS.opacity40HexCode}`
      : COLORS.transparent};
  cursor: ${CURSOR_DEFAULT};
`

const ContentArea = styled.div<{
  zIndex: string | number
  position: Position
  noPadding: boolean
}>`
  display: ${DISPLAY_FLEX};
  position: ${POSITION_ABSOLUTE};
  align-items: ${({ position }) =>
    position === 'center' ? ALIGN_CENTER : ALIGN_END};
  justify-content: ${({ position }) =>
    position === 'center' ? JUSTIFY_CENTER : JUSTIFY_END};
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
  padding: ${({ noPadding }) => (noPadding ? 0 : SPACING.spacing16)};
`

const ModalArea = styled.div<
  { isFullPage: boolean; backgroundColor?: string } & StyleProps
>`
  position: ${POSITION_RELATIVE};
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  overflow: ${OVERFLOW_HIDDEN};
  max-height: 100%;
  width: 100%;
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: ${BORDERS.smallDropShadow};
  height: ${({ isFullPage }) => (isFullPage ? '100%' : 'auto')};
  background-color: ${COLORS.white};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-radius: ${BORDERS.borderRadius16};
  }
  ${styleProps as any};
`

const ModalBody = styled.div.withConfig({
  shouldForwardProp: prop => (prop as string) !== 'allowOverflow',
})<{ allowOverflow: boolean }>`
  flex: ${FLEX_AUTO};
  min-height: 0;
  overflow-y: ${({ allowOverflow }) =>
    allowOverflow ? OVERFLOW_VISIBLE : OVERFLOW_AUTO};
`

const Footer = styled.div`
  flex-shrink: 0;
  overflow: ${OVERFLOW_HIDDEN};
  background-color: ${COLORS.white};
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
`
const Header = styled.div`
  flex-shrink: 0;
  overflow: ${OVERFLOW_HIDDEN};
  background-color: ${COLORS.white};
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`
