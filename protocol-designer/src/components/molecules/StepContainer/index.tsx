import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  OverflowBtn,
  SPACING,
  StyledText,
} from '@opentrons/components'

import styles from './stepcontainer.module.css'

import type {
  PropsWithChildren,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'
import type {
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  IconName,
} from '@opentrons/components'

export interface StepContainerProps {
  iconName: IconName
  /** The number of this step in the timeline (1-based indexing), or `null` to not show a number. */
  stepNumber: number | null
  /** The first line of text. */
  text: string
  /** The second line of text. */
  subtext?: string | null

  type: 'default' | 'alt'
  size: 'iconOnly' | 'iconAndText'

  cursor: typeof CURSOR_DEFAULT | typeof CURSOR_POINTER

  /**
   * "Active" here is terminology from the designs and means something like "this is the
   * step currently being shown," unlike "active" in CSS which means "the user is
   * mid-click, holding down the button right now."
   */
  active?: boolean
  error?: boolean
  hover?: boolean
  semiTransparent?: boolean

  onClick?: (event: ReactMouseEvent) => void
  onDoubleClick?: (event: ReactMouseEvent) => void
  onOverflowMenuButtonClick?: (event: ReactMouseEvent) => void

  dataTestId?: string
}

export function StepContainer(props: StepContainerProps): ReactNode {
  const {
    iconName,
    stepNumber,
    text,
    subtext,
    type,
    size,
    error = false,
    semiTransparent = false,
    cursor,
    active = false,
    hover = false,
    onClick,
    onDoubleClick,
    onOverflowMenuButtonClick,
    dataTestId,
  } = props
  const accessibleLabel = stepNumber != null ? `${stepNumber}. ${text}` : text

  let backgroundColor = type === 'alt' ? COLORS.blue20 : COLORS.grey20
  let textColor = COLORS.black90
  let subtextColor = COLORS.grey60
  if (active) {
    backgroundColor = COLORS.blue50
    textColor = COLORS.white
    subtextColor = COLORS.transparentWhite80
  }
  if (hover && !active) {
    backgroundColor = type === 'alt' ? COLORS.blue30 : COLORS.grey30
    textColor = COLORS.black90
    subtextColor = COLORS.grey60
  }
  if (error && active) {
    backgroundColor = COLORS.red50
    textColor = COLORS.white
    subtextColor = COLORS.transparentWhite80
  }
  if (error && !active) {
    backgroundColor = COLORS.red30
    textColor = COLORS.red60
    subtextColor = COLORS.red60
  }

  return (
    <Box
      // todo(mm, 2025-08-13): <div role="button"> isn't keyboard-navigable without
      // extra effort, and might have other accessibility problems. Can this be
      // made into a real <button> or <a> or something? (Taking care to un-nest
      // the inner overflow menu button somehow, because you can't have nested
      // interactable elements.)
      role="button"
      aria-label={accessibleLabel}
      data-testid={dataTestId}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      cursor={cursor}
      // StepContainers are meant to abut each other directly, visually separating themselves
      // with this built-in internal whitespace, so things don't flicker when the cursor
      // moves between them.
      paddingY={SPACING.spacing2}
    >
      <Box
        padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        borderRadius={BORDERS.borderRadius8}
        backgroundColor={backgroundColor}
        opacity={semiTransparent ? '50%' : '100%'}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing8}
            justifyContent={
              size === 'iconAndText' ? JUSTIFY_START : JUSTIFY_CENTER
            }
            width="100%"
            minWidth="0"
          >
            {iconName != null && (
              <Icon size="1.25rem" name={iconName} color={textColor} />
            )}
            {size === 'iconAndText' && (
              <>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing4}
                  flex="1"
                  minWidth="0"
                >
                  {stepNumber != null && (
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={textColor}
                      flex="none"
                    >
                      {stepNumber}.
                    </StyledText>
                  )}
                  <Flex flexDirection={DIRECTION_COLUMN} flex="1" minWidth="0">
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      className={styles.ellipsize}
                      color={textColor}
                    >
                      {text}
                    </StyledText>
                    {subtext != null && (
                      <Subtext subtextColor={subtextColor}>{subtext}</Subtext>
                    )}
                  </Flex>
                </Flex>
                <OverflowBtn
                  flex="none"
                  aria-label={`${accessibleLabel} options`}
                  fillColor={COLORS.white}
                  onClick={onOverflowMenuButtonClick}
                  // Even when this inner OverflowBtn isn't shown, it needs to contribute to
                  // the height of the overall component.
                  visibility={active && type !== 'alt' ? 'visible' : 'hidden'}
                />
              </>
            )}
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

function Subtext(
  props: PropsWithChildren<{ subtextColor: string }>
): ReactNode {
  const { children, subtextColor } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="1.25rem" // 20px, slightly taller than captionRegular's line height.
      justifyContent={JUSTIFY_CENTER}
    >
      <StyledText
        desktopStyle="captionRegular"
        className={styles.ellipsize}
        color={subtextColor}
      >
        {children}
      </StyledText>
    </Flex>
  )
}
