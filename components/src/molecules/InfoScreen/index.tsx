import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'
import { LegacyStyledText } from '../../atoms/StyledText'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN } from '../../styles'

interface InfoScreenProps {
  content: string
  backgroundColor?: string
}

export function InfoScreen({
  content,
  backgroundColor = COLORS.grey30,
}: InfoScreenProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid="InfoScreen"
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {content}
      </LegacyStyledText>
    </Flex>
  )
}
