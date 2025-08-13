import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  OverflowBtn,
  SPACING,
  StyledText,
} from '../..'

import type { MouseEvent as ReactMouseEvent } from 'react'
import type { CURSOR_DEFAULT, CURSOR_POINTER, IconName } from '../..'

export interface StepContainerProps {
  text: string
  iconName: IconName

  type: 'default' | 'alt'
  size: 'iconOnly' | 'iconAndText'

  cursor: typeof CURSOR_DEFAULT | typeof CURSOR_POINTER

  /**
   * "Active" here is terminology from the designs and means something like "this is the
   * step currently being shown," unlike "active" in CSS which means "the user is
   * mid-click, holding down the button right now."
   */
  active: boolean
  error: boolean
  hover: boolean
  semiTransparent: boolean

  onClick?: (event: ReactMouseEvent) => void
  onDoubleClick?: (event: ReactMouseEvent) => void
  onOverflowMenuButtonClick?: (event: ReactMouseEvent) => void

  dataTestId?: string
}

export function StepContainer(props: StepContainerProps): JSX.Element {
  const {
    text,
    iconName,
    type,
    size,
    error,
    semiTransparent,
    cursor,
    active,
    hover,
    onClick,
    onDoubleClick,
    onOverflowMenuButtonClick,
    dataTestId,
  } = props

  let backgroundColor = type === 'alt' ? COLORS.blue20 : COLORS.grey20
  let color = COLORS.black90
  if (active) {
    backgroundColor = COLORS.blue50
    color = COLORS.white
  }
  if (hover && !active) {
    backgroundColor = type === 'alt' ? COLORS.blue30 : COLORS.grey30
    color = COLORS.black90
  }
  if (error && active) {
    backgroundColor = COLORS.red50
    color = COLORS.white
  }
  if (error && !active) {
    backgroundColor = COLORS.red30
    color = COLORS.red60
  }

  return (
    <Box
      // todo(mm, 2025-08-13): <div role="button"> isn't keyboard-navigable without
      // extra effort, and might have other accessibility problems. Can this be
      // made into a real <button> or <a> or something? (Taking care to un-nest
      // the inner overflow menu button somehow, because you can't have nested
      // interactable elements.)
      role="button"
      data-testid={dataTestId}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
      borderRadius={BORDERS.borderRadius8}
      width="100%"
      backgroundColor={backgroundColor}
      color={color}
      opacity={semiTransparent ? '50%' : '100%'}
      cursor={cursor}
    >
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        height="1.9375rem"
      >
        <Flex
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
          justifyContent={
            size === 'iconAndText' ? JUSTIFY_START : JUSTIFY_CENTER
          }
          width="100%"
        >
          {iconName != null && (
            <Icon
              size="1.25rem"
              name={iconName}
              color={color}
              minWidth="1.25rem"
            />
          )}
          {size === 'iconAndText' && (
            <StyledText desktopStyle="bodyDefaultRegular" css={ELLIPSIZE_STYLE}>
              {text}
            </StyledText>
          )}
        </Flex>
        {active && type !== 'alt' && (
          <OverflowBtn
            // todo(mm, 2025-08-13): This data-testid is duplicated with the container.
            // Not sure if this is intentional?
            data-testid={dataTestId}
            fillColor={COLORS.white}
            onClick={onOverflowMenuButtonClick}
          />
        )}
      </Flex>
    </Box>
  )
}

const ELLIPSIZE_STYLE = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
