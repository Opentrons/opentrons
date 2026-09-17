import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SIZE_4,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface LoadingStateProps {
  header?: string
  body?: string
}

export function LoadingState(props: LoadingStateProps): ReactNode {
  const { header, body } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      minHeight="32rem"
    >
      <Icon name="ot-spinner" spin size={SIZE_4} color={COLORS.grey50} />
      {header != null ? (
        <LegacyStyledText forwardedAs="h1">{header}</LegacyStyledText>
      ) : null}
      {body != null ? (
        <LegacyStyledText forwardedAs="p">{body}</LegacyStyledText>
      ) : null}
    </Flex>
  )
}
