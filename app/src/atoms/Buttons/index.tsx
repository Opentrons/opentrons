import * as React from 'react'
import {
  TYPOGRAPHY,
  COLORS,
  SIZE_2,
  NewPrimaryBtn,
  NewSecondaryBtn,
} from '@opentrons/components'
import { ToggleBtn, ToggleBtnProps } from '../ToggleBtn'

export const TertiaryButton = (props: any): JSX.Element => (
  <NewPrimaryBtn
    backgroundColor={COLORS.blue}
    borderRadius="20px"
    overflow="no-wrap"
    textTransform={TYPOGRAPHY.textTransformNone}
    css={TYPOGRAPHY.labelSemiBold}
    {...props}
  />
)

export const PrimaryButton = (props: any): JSX.Element => (
  <NewPrimaryBtn
    backgroundColor={COLORS.blue}
    borderRadius="3px"
    textTransform={TYPOGRAPHY.textTransformNone}
    css={TYPOGRAPHY.pSemiBold}
    {...props}
  />
)

export const SecondaryButton = (props: any): JSX.Element => (
  <NewSecondaryBtn
    color={COLORS.blue}
    borderRadius="3px"
    textTransform={TYPOGRAPHY.textTransformNone}
    css={TYPOGRAPHY.pSemiBold}
    {...props}
  />
)

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  const color = props.toggledOn ? COLORS.blue : COLORS.darkGrey
  return <ToggleBtn size={SIZE_2} color={color} {...props} />
}
