import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  LegacyStyledText,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface InfoMessageProps {
  title: string
  body?: string
}

export function InfoMessage({ title, body }: InfoMessageProps): ReactNode {
  return (
    <Flex
      backgroundColor={COLORS.blue30}
      flexDirection={DIRECTION_ROW}
      alignItems={body != null ? ALIGN_FLEX_START : ALIGN_CENTER}
      borderRadius={BORDERS.borderRadius4}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
      data-testid={`InfoMessage_${title}`}
    >
      <Icon
        color={COLORS.blue60}
        name="information"
        aria-label="icon_information"
        size={SIZE_1}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={body != null ? ALIGN_FLEX_START : ALIGN_CENTER}
        gridGap={SPACING.spacing4}
        color={COLORS.black90}
      >
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {title}
        </LegacyStyledText>
        {body != null ? (
          <LegacyStyledText forwardedAs="p">{body}</LegacyStyledText>
        ) : null}
      </Flex>
    </Flex>
  )
}
