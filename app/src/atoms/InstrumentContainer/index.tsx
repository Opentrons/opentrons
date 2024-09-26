import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

interface InstrumentContainerProps {
  displayName: string
  id?: string
}

export const InstrumentContainer = (
  props: InstrumentContainerProps
): JSX.Element => {
  const { displayName, id } = props

  return (
    <Flex
      backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
      borderRadius={BORDERS.borderRadius4}
      paddingX={SPACING.spacing8}
      paddingY={SPACING.spacing2}
      width="max-content"
    >
      <LegacyStyledText as="p" id={id}>
        {displayName}
      </LegacyStyledText>
    </Flex>
  )
}
