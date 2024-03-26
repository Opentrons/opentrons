import * as React from 'react'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SIZE_4,
  StyledText,
} from '@opentrons/components'

interface LoadingStateProps {
  header?: string
  body?: string
}

export function LoadingState(props: LoadingStateProps): JSX.Element {
  const { header, body } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      minHeight="32rem"
    >
      <Icon name="ot-spinner" spin size={SIZE_4} color={COLORS.grey50} />
      {header != null ? <StyledText as="h1">{header}</StyledText> : null}
      {body != null ? <StyledText as="p">{body}</StyledText> : null}
    </Flex>
  )
}
