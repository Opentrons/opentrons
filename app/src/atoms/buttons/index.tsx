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
  background-color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.background};
  overflow: no-wrap;
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warning};
  }

  &:disabled {
    background-color: ${COLORS.greyDisabled};
    color: ${COLORS.disabled};
  }
`

export const SecondaryTertiaryButton = styled(NewSecondaryBtn)`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.blue};
  overflow: no-wrap;
  padding: 0.375rem 0.75rem;
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  &:hover {
    opacity: 0.7;
    box-shadow: 0 0 0;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warning};
  }

  &:disabled {
    opacity: 50%;
  }
`

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  background-color: ${COLORS.error};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  box-shadow: 0 0 0;
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:hover {
    box-shadow: 0 0 0;
  }
`

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  box-shadow: none;
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  box-shadow: 0 0 0;
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:hover, &:focus {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warning};
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:disabled {
    background-color: ${COLORS.greyDisabled};
    color: ${COLORS.disabled};
  }
`

export const SecondaryButton = styled(NewSecondaryBtn)`
  color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  background-color: ${COLORS.transparent};
  ${TYPOGRAPHY.pSemiBold}
  background-color: ${COLORS.transparent};

  ${styleProps}

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warning};
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
    box-shadow: 0 0 0 3px ${COLORS.warning};
  }

  &:disabled {
    color: ${COLORS.greyDisabled};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blue};

  &:hover {
    color: ${COLORS.blueHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warning};
  }

  &:disabled {
    color: ${COLORS.greyDisabled};
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
    background-color: ${COLORS.blue};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing3} ${SPACING.spacing4};
    color: ${COLORS.white};
    line-height: ${TYPOGRAPHY.lineHeight20};
    ${TYPOGRAPHY.pSemiBold}
    width: 100%;
    border: none;

    ${styleProps}

    &:focus-visible {
      box-shadow: 0 0 0 3px ${COLORS.warning};
    }

    &:hover {
      background-color: ${COLORS.blueHover};
      box-shadow: 0 0 0;
    }

    &:active {
      background-color: ${COLORS.bluePressed};
    }

    &:disabled {
      background-color: ${COLORS.greyDisabled};
      color: ${COLORS.disabled};
    }
  `
  return <input {...props} css={SUBMIT_INPUT_STYLE} type="submit" />
}
