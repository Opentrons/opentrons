import * as React from 'react'

import * as Styles from '../styles'
import { Box, Flex } from '../primitives'
import { COLORS, SPACING } from '../ui-style-constants'
import type { StyleProps } from '../primitives'
import { POSITION_FIXED } from '../styles'
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
  padding: `${SPACING.spacing16}, ${SPACING.spacing24}`,
} as const

const MODAL_STYLE = {
  backgroundColor: Styles.C_WHITE,
  position: Styles.POSITION_RELATIVE,
  overflowY: Styles.OVERFLOW_AUTO,
  maxHeight: '100%',
  width: '100%',
} as const

const HEADER_STYLE = {
  backgroundColor: Styles.C_LIGHT_GRAY,
  position: Styles.POSITION_STICKY,
  padding: SPACING.spacing16,
  top: 0,
} as const

const FOOTER_STYLE = {
  backgroundColor: Styles.C_WHITE,
  position: Styles.POSITION_STICKY,
  padding: SPACING.spacing16,
  bottom: 0,
} as const

const CONTENT_STYLE = {
  paddingTop: SPACING.spacing16,
  paddingX: SPACING.spacing24,
  paddingBottom: SPACING.spacing24,
} as const

export interface BaseModalProps extends StyleProps {
  /** Overlay color, defaults to `OVERLAY_GRAY_90` */
  overlayColor?: string
  /** Optional close on outside click **/
  onOutsideClick?: React.MouseEventHandler
  /** Optional sticky header */
  header?: React.ReactNode
  /** Option to turn off headerStyles */
  noHeaderStyles?: boolean
  /** Optional sticky footer */
  footer?: React.ReactNode
  /** Modal content */
  children?: React.ReactNode
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
export function BaseModal(props: BaseModalProps): JSX.Element {
  const {
    overlayColor = COLORS.backgroundOverlay,
    onOutsideClick,
    zIndex = 10,
    header,
    footer,
    children,
    noHeaderStyles,
    ...styleProps
  } = props

  const headerStyle = props.noHeaderStyles === true ? null : HEADER_STYLE

  return (
    <Flex
      position={POSITION_FIXED}
      left="0"
      right="0"
      top="0"
      bottom="0"
      zIndex="1"
      backgroundColor={overlayColor}
      cursor="default"
      onClick={e => {
        e.stopPropagation()
        if (onOutsideClick) onOutsideClick(e)
      }}
    >
      <Flex {...BASE_STYLE} zIndex={zIndex}>
        <Box
          {...MODAL_STYLE}
          {...styleProps}
          onClick={e => {
            e.stopPropagation()
          }}
        >
          {header != null ? <Box {...headerStyle}>{header}</Box> : null}
          <Box {...CONTENT_STYLE}>{children}</Box>
          {footer != null ? <Box {...FOOTER_STYLE}>{footer}</Box> : null}
        </Box>
      </Flex>
    </Flex>
  )
}
