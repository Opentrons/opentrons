import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface StepFormStatusProps {
  label: string
  value: string
}

/**
 * A part of a step form that's a label-value pair like "Temperature: 50 °C,"
 * to indicate the status of something. Styled as a block.
 *
 * For proper DOM hierarchy, must be nested within a `StepFormStatusList.`
 */
export function StepFormStatus(props: StepFormStatusProps): ReactNode {
  const { label, value } = props
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing16}
      borderRadius={BORDERS.borderRadius4}
      backgroundColor={COLORS.grey20}
    >
      <dt>
        <StyledText
          as="span"
          desktopStyle="bodyDefaultRegular"
          color={COLORS.black90}
        >
          {label}
        </StyledText>
      </dt>
      <dd>
        <Tag type="default" text={value} />
      </dd>
    </Flex>
  )
}
