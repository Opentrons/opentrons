import * as React from 'react'
import { css } from 'styled-components'
import {
  SPACING,
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
<<<<<<< HEAD
    background-color: ${COLORS.blue50};
=======
    background-color: ${COLORS.blueEnabled};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing8} ${SPACING.spacing16};
    color: ${COLORS.white};
    ${TYPOGRAPHY.pSemiBold}
    width: 100%;
    border: none;

    ${styleProps}

    &:focus-visible {
      box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
    }

    &:hover {
<<<<<<< HEAD
      background-color: ${COLORS.blue55};
=======
      background-color: ${COLORS.blueHover};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
      box-shadow: 0 0 0;
    }

    &:active {
<<<<<<< HEAD
      background-color: ${COLORS.blue60};
=======
      background-color: ${COLORS.bluePressed};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    }

    &:disabled {
      background-color: ${COLORS.grey50Disabled};
      color: ${COLORS.successDisabled};
    }
  `
  return <input {...props} css={SUBMIT_INPUT_STYLE} type="submit" />
}
