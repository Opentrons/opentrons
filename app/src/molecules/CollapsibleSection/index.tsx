import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  Btn,
  Icon,
  SIZE_1,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyleProps,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface CollapsibleSectionProps extends StyleProps {
  title: string
  children: React.ReactNode
}

export function CollapsibleSection(
  props: CollapsibleSectionProps
): JSX.Element {
  const { title, children, ...styleProps } = props
  const [isExpanded, setIsExpanded] = React.useState(true)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} {...styleProps}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {title}
        </StyledText>
        <Btn onClick={() => setIsExpanded(!isExpanded)}>
          <Icon size={SIZE_1} name={isExpanded ? 'minus' : 'plus'} />
        </Btn>
      </Flex>
      {isExpanded ? children : null}
    </Flex>
  )
}
