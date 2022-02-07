import * as React from 'react'
import { Text, TYPOGRAPHY } from '@opentrons/components'

export interface Props extends React.ComponentProps<typeof Text> {
  children: React.ReactNode
}

// stylemap defaults to regular style, pass in fontWeight={variable} to override
const styleMap = {
  h1: TYPOGRAPHY.h1Default,
  h2: TYPOGRAPHY.h2Regular,
  h3: TYPOGRAPHY.h3Regular,
  h6: TYPOGRAPHY.h6Default,
  p: TYPOGRAPHY.pRegular,
  label: TYPOGRAPHY.labelRegular,
}

export function StyledText(props: Props): JSX.Element {
  // @ts-expect-error: props.as is coming in as a string but TS is expecting type any
  const css = props.as ? styleMap[props.as] : null
  return (
    <Text css={css} {...props}>
      {props.children}
    </Text>
  )
}
