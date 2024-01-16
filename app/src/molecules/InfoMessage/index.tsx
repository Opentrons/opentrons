import * as React from 'react'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export interface InfoMessageProps {
  title: string
  body?: string
}

export function InfoMessage({ title, body }: InfoMessageProps): JSX.Element {
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      flexDirection={DIRECTION_ROW}
      alignItems={body != null ? ALIGN_FLEX_START : ALIGN_CENTER}
      borderRadius={BORDERS.radiusSoftCorners}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
      data-testid={`InfoMessage_${title}`}
    >
      <Icon
        color={COLORS.grey50}
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
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {title}
        </StyledText>
        {body != null ? <StyledText as="p">{body}</StyledText> : null}
      </Flex>
    </Flex>
  )
}
