import * as React from 'react'

import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'
import { StyledText } from '../../atoms/StyledText'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN } from '../../styles'

interface InfoScreenProps {
  contentType: 'parameters' | 'moduleControls'
}

export function InfoScreen({ contentType }: InfoScreenProps): JSX.Element {
  const bodyText =
    contentType === 'parameters'
      ? 'No parameters specified in this protocol'
      : 'Connect modules to see controls'
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={COLORS.grey30}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid={`InfoScreen_${contentType}`}
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {bodyText}
      </StyledText>
    </Flex>
  )
}
