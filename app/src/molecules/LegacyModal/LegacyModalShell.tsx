import * as React from 'react'
import styled from 'styled-components'
import {
  StyleProps,
  COLORS,
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
  SPACING,
} from '@opentrons/components'
export interface LegacyModalShellProps extends StyleProps {
  /** Modal content */
  children: React.ReactNode
  /** Optional close on outside click **/
  onOutsideClick?: React.MouseEventHandler
  /** Optional sticky header */
  header?: React.ReactNode
  /** Optional sticky footer */
  footer?: React.ReactNode
  /** Optional full page takeover */
  fullPage?: boolean
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
export function LegacyModalShell(props: LegacyModalShellProps): JSX.Element {
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
      aria-label="BackgroundOverlay_ModalShell"
      onClick={e => {
        e.stopPropagation()
        if (onOutsideClick != null) onOutsideClick(e)
      }}
    >
      <ContentArea zIndex={zIndex}>
        <ModalArea
          isFullPage={fullPage}
          onClick={e => {
            e.stopPropagation()
          }}
          {...styleProps}
        >
          {header != null ? <Header>{header}</Header> : null}
          {children}
          {footer != null ? <Footer>{footer}</Footer> : null}
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
  cursor: default;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.darkBlack60};
  }
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
  padding: ${SPACING.spacing16};
`

const ModalArea = styled.div<
  { isFullPage: boolean; backgroundColor?: string } & StyleProps
>`
  position: ${POSITION_RELATIVE};
  overflow-y: ${OVERFLOW_AUTO};
  max-height: 100%;
  width: 100%;
  border-radius: ${BORDERS.radiusSoftCorners};
  box-shadow: ${BORDERS.smallDropShadow};
  height: ${({ isFullPage }) => (isFullPage ? '100%' : 'auto')};
  background-color: ${COLORS.white};
  ${styleProps};
`

const Footer = styled.div`
  background-color: ${COLORS.white};
  position: ${POSITION_STICKY};
  bottom: 0;
`
const Header = styled.div`
  background-color: ${COLORS.white};
  position: ${POSITION_STICKY};
  top: 0;
`
