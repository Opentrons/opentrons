import * as React from 'react'
import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { StyleProps } from '@opentrons/components'

type smallButtonTypes = 'alt' | 'alert' | 'default' | 'ghostHigh' | 'ghostLow'
interface SmallButtonProps extends StyleProps {
  onClick: () => void
  buttonType: smallButtonTypes
  buttonText: React.ReactNode
  //  optional text color for the 2 ghostHigh options
  textColor?: string
  disabled?: boolean
}

export function SmallButton(props: SmallButtonProps): JSX.Element {
  const { onClick, buttonType, buttonText, textColor, disabled } = props
  const buttonProps = {
    onClick,
    disabled,
  }
  const styledButtonText = (
    <StyledText
      fontSize="1.375rem"
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      padding={SPACING.spacing4}
    >
      {buttonText}
    </StyledText>
  )

  let button
  switch (buttonType) {
    case 'default': {
      button = (
        <Default {...buttonProps} aria-label="SmallButton_Default">
          {styledButtonText}
        </Default>
      )
      break
    }
    case 'alert': {
      button = (
        <Alert {...buttonProps} aria-label="SmallButton_Alert">
          {styledButtonText}
        </Alert>
      )
      break
    }
    case 'alt': {
      button = (
        <Alt {...buttonProps} aria-label="SmallButton_Alt">
          {styledButtonText}
        </Alt>
      )
      break
    }
    case 'ghostLow': {
      button = (
        <GhostLow {...buttonProps} aria-label="SmallButton_GhostLow">
          {styledButtonText}
        </GhostLow>
      )

      break
    }
    case 'ghostHigh': {
      if (textColor === COLORS.blueEnabled) {
        button = (
          <GhostHighBlue
            {...buttonProps}
            aria-label="SmallButton_GhostHighBlue"
          >
            {styledButtonText}
          </GhostHighBlue>
        )
      } else {
        button = (
          <GhostHighBlackColor
            {...buttonProps}
            aria-label="SmallButton_GhostHighBlack"
          >
            {styledButtonText}
          </GhostHighBlackColor>
        )
      }
    }
  }

  return button
}

const Default = styled(NewPrimaryBtn)`
  color: ${COLORS.white};
  background-color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.size_three};
  cursor: default;
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: #045dd1;
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blueEnabled};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: #045dd1;
  }

  &:disabled {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`

const Alert = styled(NewPrimaryBtn)`
  color: ${COLORS.white};
  background-color: ${COLORS.errorEnabled};
  cursor: default;
  border-radius: ${BORDERS.size_three};
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: ${COLORS.errorEnabled};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.errorEnabled};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: #b01f22;
  }

  &:disabled {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`

const Alt = styled(NewPrimaryBtn)`
  color: ${COLORS.darkBlackEnabled};
  background-color: ${COLORS.foundationalBlue};
  cursor: default;
  border-radius: ${BORDERS.size_three};
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: ${COLORS.foundationalBlue}${COLORS.opacity20HexCode};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.foundationalBlue};
    color: ${COLORS.darkBlackEnabled};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: #94b0d5;
  }

  &:disabled {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`

const GhostLow = styled(NewPrimaryBtn)`
  color: ${COLORS.darkBlackEnabled}${COLORS.opacity70HexCode};
  background-color: ${COLORS.blueEnabled}00;
  cursor: default;
  border-radius: ${BORDERS.size_three};
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity70HexCode};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
  }

  &:disabled {
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`

const GhostHighBlackColor = styled(NewPrimaryBtn)`
  color: ${COLORS.darkBlackEnabled};
  background-color: ${COLORS.blueEnabled}00;
  cursor: default;
  border-radius: ${BORDERS.size_three};
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.darkBlackEnabled};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
  }

  &:disabled {
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`
const GhostHighBlue = styled(NewPrimaryBtn)`
  color: ${COLORS.blueEnabled};
  background-color: ${COLORS.blueEnabled}00;
  cursor: default;
  border-radius: ${BORDERS.size_three};
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
  &:focus {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.blueEnabled};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
  }

  &:disabled {
    background-color: ${COLORS.blueEnabled}00;
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`
