import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SIZE_4,
  LegacyStyledText,
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
      {header != null ? (
        <LegacyStyledText as="h1">{header}</LegacyStyledText>
      ) : null}
      {body != null ? <LegacyStyledText as="p">{body}</LegacyStyledText> : null}
    </Flex>
  )
}
