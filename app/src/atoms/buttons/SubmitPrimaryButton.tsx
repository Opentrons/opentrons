import * as React from 'react'
import { css } from 'styled-components'
import {
  SPACING,
  LEGACY_COLORS,
  COLORS,
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
    background-color: ${COLORS.blue50};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing8} ${SPACING.spacing16};
    color: ${COLORS.white};
    ${TYPOGRAPHY.pSemiBold}
    width: 100%;
    border: none;

    ${styleProps}

    &:focus-visible {
      box-shadow: 0 0 0 3px ${COLORS.yellow50};
    }

    &:hover {
      background-color: ${COLORS.blue55};
      box-shadow: 0 0 0;
    }

    &:active {
      background-color: ${COLORS.blue60};
    }

    &:disabled {
      background-color: ${COLORS.grey50Disabled};
      color: ${COLORS.grey40};
    }
  `
  return <input {...props} css={SUBMIT_INPUT_STYLE} type="submit" />
}
