import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Overlay,
  POSITION_ABSOLUTE,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface overlayButtonProps {
  onClick: () => void
  text: string
}

export interface OverlayModalProps {
  header: string
  subText?: string
  primaryButtonProps?: overlayButtonProps
  secondaryButtonProps?: overlayButtonProps
}

export function OverlayModal(props: OverlayModalProps): ReactNode {
  const { header, subText, primaryButtonProps, secondaryButtonProps } = props
  return (
    <Overlay
      width="100%"
      height="100%"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.transparentBlack90}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Flex
        width="100%"
        height="100%"
        flexDirection={DIRECTION_COLUMN}
        maxWidth="445px"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing16}
        textAlign={TEXT_ALIGN_CENTER}
      >
        <StyledText
          desktopStyle="headingLargeBold"
          oddStyle="level4HeaderBold"
          color={COLORS.white}
        >
          {header}
        </StyledText>
        {subText != null ? (
          <StyledText
            desktopStyle="bodyLargeRegular"
            oddStyle="smallBodyTextRegular"
            color={COLORS.white}
          >
            {subText}
          </StyledText>
        ) : null}
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing8}
        >
          {secondaryButtonProps && (
            <SecondaryButton
              backgroundColor={COLORS.white}
              onClick={secondaryButtonProps?.onClick}
            >
              {secondaryButtonProps?.text}
            </SecondaryButton>
          )}
          {primaryButtonProps && (
            <PrimaryButton
              variant="warning"
              onClick={primaryButtonProps?.onClick}
            >
              {primaryButtonProps?.text}
            </PrimaryButton>
          )}
        </Flex>
      </Flex>
    </Overlay>
  )
}
