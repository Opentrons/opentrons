import { createPortal } from 'react-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Modal,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'

export * from './useOverlayModal'
export interface OverlayModalProps {
  header: string
  subText?: string
  children: ReactNode
}

export function OverlayModal(props: OverlayModalProps): JSX.Element {
  const { header, subText, children} = props
  return createPortal(
    <Modal
      marginLeft="0"
      zIndexOverlay={15}
      width="100%"
      height="100%"
      hasHeader={false}
      backgroundColor={COLORS.transparentBlack90}
      showOverlay={true}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        marginTop={SPACING.spacing120}
      >
        <StyledText desktopStyle="headingLargeBold" oddStyle="level4HeaderBold" color={COLORS.white}>
          {header}
        </StyledText>
        {subText != null ? (
          <StyledText
            desktopStyle="bodyLargeRegular"
            oddStyle="bodyTextRegular"
            color={COLORS.white}
          >
            {subText}
          </StyledText>
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {children}
        </Flex>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}
