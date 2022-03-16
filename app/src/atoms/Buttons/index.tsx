import * as React from 'react'
import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  BORDERS,
  SIZE_2,
  NewPrimaryBtn,
  NewSecondaryBtn,
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
`

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}
`

export const SecondaryButton = styled(NewSecondaryBtn)`
  background-color: ${COLORS.blue};
  border-radius: ${BORDERS.radiusSoftCorners};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}
`

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  const color = props.toggledOn ? COLORS.blue : COLORS.darkGrey
  return <ToggleBtn size={SIZE_2} color={color} {...props} />
}
