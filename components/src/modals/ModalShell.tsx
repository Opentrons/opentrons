import * as React from 'react'
import styled from 'styled-components'
import { BORDERS, COLORS, RESPONSIVENESS, SPACING } from '../ui-style-constants'
import { StyleProps, styleProps } from '../primitives'
import {
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  POSITION_FIXED,
  POSITION_RELATIVE,
  POSITION_STICKY,
} from '../styles'
export interface ModalShellProps extends StyleProps {
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

interface OverlayProps {
  children?: React.ReactNode
  'aria-label'?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

interface ContentAreaProps {
  children?: React.ReactNode
  zIndex: string | number
}

interface ModalAreaProps extends StyleProps {
  isFullPage: boolean
  backgroundColor?: string
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
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
      aria-label="BackgroundOverlay_ModalShell"
      onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.stopPropagation()
        if (onOutsideClick != null) onOutsideClick(e)
      }}
    >
      <ContentArea zIndex={zIndex}>
        <ModalArea
          isFullPage={fullPage}
          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
            console.log(typeof e)
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

const Overlay = styled.div<OverlayProps>`
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
const ContentArea = styled.div<ContentAreaProps>`
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

const ModalArea = styled.div<ModalAreaProps>`
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
