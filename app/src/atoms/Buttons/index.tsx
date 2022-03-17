import * as React from 'react'
import {
  TYPOGRAPHY,
  COLORS,
  BORDERS,
  SIZE_2,
  NewPrimaryBtn,
  NewSecondaryBtn,
  NewAlertPrimaryBtn,
} from '@opentrons/components'
import { ToggleBtn, ToggleBtnProps } from '../ToggleBtn'

export const TertiaryButton = (props: any): JSX.Element => (
  <NewPrimaryBtn
    backgroundColor={COLORS.blue}
    borderRadius={BORDERS.radiusRoundEdge}
    overflow="no-wrap"
    textTransform={TYPOGRAPHY.textTransformNone}
    css={TYPOGRAPHY.labelSemiBold}
    {...props}
  />
)

interface PrimaryButtonProps
  extends React.ComponentProps<typeof NewPrimaryBtn> {
  isDestructive?: boolean
}
export const PrimaryButton = ({
  isDestructive = false,
  ...restProps
}: PrimaryButtonProps): JSX.Element =>
  isDestructive ? (
    <NewAlertPrimaryBtn
      backgroundColor={COLORS.error}
      borderRadius={BORDERS.radiusSoftCorners}
      textTransform={TYPOGRAPHY.textTransformNone}
      css={TYPOGRAPHY.pSemiBold}
      {...restProps}
    />
  ) : (
    <NewPrimaryBtn
      backgroundColor={COLORS.blue}
      borderRadius={BORDERS.radiusSoftCorners}
      textTransform={TYPOGRAPHY.textTransformNone}
      css={TYPOGRAPHY.pSemiBold}
      {...restProps}
    />
  )

export const SecondaryButton = (props: any): JSX.Element => (
  <NewSecondaryBtn
    color={COLORS.blue}
    borderRadius={BORDERS.radiusSoftCorners}
    textTransform={TYPOGRAPHY.textTransformNone}
    css={TYPOGRAPHY.pSemiBold}
    {...props}
  />
)

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  const color = props.toggledOn ? COLORS.blue : COLORS.darkGrey
  return <ToggleBtn size={SIZE_2} color={color} {...props} />
}
