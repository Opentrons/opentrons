import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN, JUSTIFY_CENTER } from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'

import type { ReactNode } from 'react'
import type { IconName } from '../../icons'

interface InfoScreenProps {
  content: string
  subContent?: string
  backgroundColor?: string
  height?: string
  /* Optional icon name override. Defaults to `ot-alert`. */
  iconName?: IconName
}

export function InfoScreen({
  content,
  subContent,
  backgroundColor = COLORS.grey30,
  height = '100%',
  iconName,
}: InfoScreenProps): ReactNode {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height={height}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid="InfoScreen"
    >
      <Icon
        name={iconName ?? 'ot-alert'}
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
        spin={iconName === 'ot-spinner'}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing4}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">{content}</StyledText>
        {subContent != null ? (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {subContent}
          </StyledText>
        ) : null}
      </Flex>
    </Flex>
  )
}
