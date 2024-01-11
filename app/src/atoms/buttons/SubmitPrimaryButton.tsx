import * as React from 'react'
import { css } from 'styled-components'
import {
  SPACING,
  LEGACY_COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

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
    background-color: ${LEGACY_COLORS.blueEnabled};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing8} ${SPACING.spacing16};
    color: ${LEGACY_COLORS.white};
    ${TYPOGRAPHY.pSemiBold}
    width: 100%;
    border: none;

    ${styleProps}

    &:focus-visible {
      box-shadow: 0 0 0 3px ${LEGACY_COLORS.warningEnabled};
    }

    &:hover {
      background-color: ${LEGACY_COLORS.blueHover};
      box-shadow: 0 0 0;
    }

    &:active {
      background-color: ${LEGACY_COLORS.bluePressed};
    }

    &:disabled {
      background-color: ${LEGACY_COLORS.darkGreyDisabled};
      color: ${LEGACY_COLORS.successDisabled};
    }
  `
  return <input {...props} css={SUBMIT_INPUT_STYLE} type="submit" />
}
