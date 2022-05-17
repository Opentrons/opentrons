import * as React from 'react'
import { Text, TYPOGRAPHY } from '@opentrons/components'
import styled, { FlattenSimpleInterpolation } from 'styled-components'

export interface Props extends React.ComponentProps<typeof Text> {
  children: React.ReactNode
}

const styleMap: { [tag: string]: FlattenSimpleInterpolation } = {
  h1: TYPOGRAPHY.h1Default,
  h2: TYPOGRAPHY.h2Regular,
  h3: TYPOGRAPHY.h3Regular,
  h6: TYPOGRAPHY.h6Default,
  p: TYPOGRAPHY.pRegular,
  label: TYPOGRAPHY.labelRegular,
  h2SemiBold: TYPOGRAPHY.h2SemiBold,
  h3SemiBold: TYPOGRAPHY.h3SemiBold,
  h6SemiBold: TYPOGRAPHY.h6SemiBold,
  pSemiBold: TYPOGRAPHY.pSemiBold,
  labelSemiBold: TYPOGRAPHY.labelSemiBold,
}

export const StyledText = styled(Text)<Props>`
  ${props =>
    styleMap[
      `${String(props.as)}${
        props.fontWeight === TYPOGRAPHY.fontWeightSemiBold ? 'SemiBold' : ''
      }`
    ]}
`
