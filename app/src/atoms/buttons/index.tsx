import * as React from 'react'
import styled from 'styled-components'
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
  padding: 0.375rem 0.75rem;
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    background-color: ${COLORS.blueHover};
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

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  background-color: ${COLORS.error};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}
`

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

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

export const SecondaryButton = styled(NewSecondaryBtn)`
  color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

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

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  const color = props.toggledOn ? COLORS.blue : COLORS.darkGrey
  return <ToggleBtn size={SIZE_2} color={color} {...props} />
}
