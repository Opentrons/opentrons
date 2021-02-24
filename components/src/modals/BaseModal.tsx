
import * as React from 'react'

import * as Styles from '../styles'
import { Box, Flex } from '../primitives'
import type { StyleProps } from '../primitives'

const BASE_STYLE = {
  position: Styles.POSITION_ABSOLUTE,
  alignItems: Styles.ALIGN_CENTER,
  justifyContent: Styles.JUSTIFY_CENTER,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  padding: Styles.SPACING_5,
}

const MODAL_STYLE = {
  backgroundColor: Styles.C_WHITE,
  position: Styles.POSITION_RELATIVE,
  overflowY: Styles.OVERFLOW_AUTO,
  maxHeight: '100%',
  width: '100%',
}

const HEADER_STYLE = {
  backgroundColor: Styles.C_LIGHT_GRAY,
  position: Styles.POSITION_STICKY,
  padding: Styles.SPACING_3,
  top: 0,
}

const FOOTER_STYLE = {
  backgroundColor: Styles.C_WHITE,
  position: Styles.POSITION_STICKY,
  padding: Styles.SPACING_3,
  bottom: 0,
}

const CONTENT_STYLE = {
  paddingX: Styles.SPACING_4,
  paddingY: Styles.SPACING_3,
}

export type BaseModalProps = {
  /** Overlay color, defaults to `OVERLAY_GRAY_90` */
  overlayColor?: string,
  /** Optional sticky header */
  header?,
  /** Optional sticky footer */
  footer?,
  /** Modal content */
  children?: React.ReactNode,
  ...StyleProps,
}

/**
 * A BaseModal is a layout component for building more specific modals.
 *
 * It includes:
 * - An overlay, customizable with the `overlayColor` prop
 * - A content area, with `overflow-y: auto` and customizable with style props
 * - An optional sticky header
 * - An optional sticky footer
 */
export function BaseModal(props: BaseModalProps) {
  const {
    overlayColor = Styles.OVERLAY_GRAY_90,
    zIndex = 10,
    header,
    footer,
    children,
    ...styleProps
  } = props

  return (
    <Flex {...BASE_STYLE} backgroundColor={overlayColor} zIndex={zIndex}>
      <Box {...MODAL_STYLE} {...styleProps}>
        {header != null ? <Box {...HEADER_STYLE}>{header}</Box> : null}
        <Box {...CONTENT_STYLE}>{children}</Box>
        {footer != null ? <Box {...FOOTER_STYLE}>{footer}</Box> : null}
      </Box>
    </Flex>
  )
}
