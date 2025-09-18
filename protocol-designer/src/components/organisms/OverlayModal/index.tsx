import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Overlay,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

export interface OverlayModalProps {
  header: string
  subText?: string
  primaryButtonText: string
  secondaryButtonText: string
  onSecondaryButtonClick: () => void
  onPrimaryButtonClick: () => void
}

export function OverlayModal(props: OverlayModalProps): JSX.Element {
  const {
    header,
    subText,
    onSecondaryButtonClick,
    onPrimaryButtonClick,
    primaryButtonText,
    secondaryButtonText,
  } = props
  return (
    <Overlay
      width="100%"
      height="100%"
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
        className="overlay-modal-content"
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
          <SecondaryButton
            backgroundColor={COLORS.white}
            onClick={() => {
              onSecondaryButtonClick()
            }}
          >
            {secondaryButtonText ?? 'cancel'}
          </SecondaryButton>
          <PrimaryButton
            backgroundColor={COLORS.red50}
            onClick={() => {
              onPrimaryButtonClick()
            }}
          >
            {primaryButtonText ?? 'continue'}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Overlay>
  )
}
