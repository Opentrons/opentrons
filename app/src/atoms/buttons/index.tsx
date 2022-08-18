import * as React from 'react'
import styled, { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  BORDERS,
  SIZE_2,
  SPACING,
  NewAlertPrimaryBtn,
  NewPrimaryBtn,
  NewSecondaryBtn,
  styleProps,
} from '@opentrons/components'
import { ToggleBtn, ToggleBtnProps } from '../ToggleBtn'

export const TertiaryButton = styled(NewPrimaryBtn)`
  && {
    background-color: ${COLORS.blueEnabled};
    border-radius: ${BORDERS.radiusRoundEdge};
    box-shadow: none;
    color: ${COLORS.fundamentalsBackground};
    overflow: no-wrap;
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    white-space: nowrap;
    ${TYPOGRAPHY.labelSemiBold}

    ${styleProps}
  }
  &:hover {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:disabled {
    background-color: ${COLORS.darkGreyDisabled};
    color: ${COLORS.errorDisabled};
  }
`

export const SecondaryTertiaryButton = styled(NewSecondaryBtn)`
  && {
    background-color: ${COLORS.white};
    border-radius: ${BORDERS.radiusRoundEdge};
    box-shadow: none;
    color: ${COLORS.blueEnabled};
    overflow: no-wrap;
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    white-space: nowrap;
    ${TYPOGRAPHY.labelSemiBold}

    ${styleProps}
  }
  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    opacity: 50%;
  }
`

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  && {
    background-color: ${COLORS.errorEnabled};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    box-shadow: 0 0 0;
    ${TYPOGRAPHY.pSemiBold}

    ${styleProps}
  }
  &:hover {
    box-shadow: 0 0 0;
  }
`

export const PrimaryButton = styled(NewPrimaryBtn)`
  && {
    background-color: ${COLORS.blueEnabled};
    border-radius: ${BORDERS.radiusSoftCorners};
    box-shadow: none;
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    line-height: ${TYPOGRAPHY.lineHeight20};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    ${TYPOGRAPHY.pSemiBold}

    ${styleProps}
  }
  &:hover,
  &:focus {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:disabled {
    background-color: ${COLORS.darkGreyDisabled};
    color: ${COLORS.errorDisabled};
  }
`

export const SecondaryButton = styled(NewSecondaryBtn)`
  && {
    color: ${COLORS.blueEnabled};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    background-color: ${COLORS.transparent};
    ${TYPOGRAPHY.pSemiBold}
    background-color: ${COLORS.transparent};

    ${styleProps}
  }
  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:disabled {
    opacity: 50%;
  }
`

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    color: ${COLORS.darkGreyHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    color: ${COLORS.darkGreyDisabled};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blueEnabled};

  &:hover {
    color: ${COLORS.blueHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    color: ${COLORS.darkGreyDisabled};
  }
`

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  return (
    <ToggleBtn
      size={SIZE_2}
      css={props.toggledOn ? TOGGLE_ENABLED_STYLES : TOGGLE_DISABLED_STYLES}
      {...props}
    />
  )
}

interface SubmitPrimaryButtonProps {
  form: string
  value: string
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => unknown
  disabled?: boolean
}
export const SubmitPrimaryButton = (
  props: SubmitPrimaryButtonProps
): JSX.Element => {
  const SUBMIT_INPUT_STYLE = css`
    background-color: ${COLORS.blueEnabled};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    color: ${COLORS.white};
    line-height: ${TYPOGRAPHY.lineHeight20};
    ${TYPOGRAPHY.pSemiBold}
    width: 100%;
    border: none;

    ${styleProps}

    &:focus-visible {
      box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
    }

    &:hover {
      background-color: ${COLORS.blueHover};
      box-shadow: 0 0 0;
    }

    &:active {
      background-color: ${COLORS.bluePressed};
    }

    &:disabled {
      background-color: ${COLORS.darkGreyDisabled};
      color: ${COLORS.successDisabled};
    }
  `
  return <input {...props} css={SUBMIT_INPUT_STYLE} type="submit" />
}
