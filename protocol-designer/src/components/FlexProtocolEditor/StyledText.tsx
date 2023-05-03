import * as React from 'react'
import { Text } from '@opentrons/components'
import styled, { FlattenSimpleInterpolation } from 'styled-components'
import { TYPOGRAPHY } from './constant'

export interface Props extends React.ComponentProps<typeof Text> {
  children: React.ReactNode
}

const styleMap: { [tag: string]: FlattenSimpleInterpolation } = {
  h1: TYPOGRAPHY.h1Default,
  h2: TYPOGRAPHY.h2SemiBold,
  h3: TYPOGRAPHY.h3SemiBold,
  h4: TYPOGRAPHY.h4Regular,
  h5: TYPOGRAPHY.h5Default,
  p: TYPOGRAPHY.pRegular,
  label: TYPOGRAPHY.labelItalic,
}

export const StyledText = styled(Text)<Props>`
  ${props =>
    styleMap[
      `${String(props.as)}${
        props.fontWeight === TYPOGRAPHY.fontWeightLevel2Bold ? 'SemiBold' : ''
      }`
    ]}
`
