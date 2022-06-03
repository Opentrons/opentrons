import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  Btn,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyleProps,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface CollapsibleSectionProps extends StyleProps {
  title: string
  children: React.ReactNode
  isExpandedInitially?: boolean
}

export function CollapsibleSection(
  props: CollapsibleSectionProps
): JSX.Element {
  const { title, children, isExpandedInitially = true, ...styleProps } = props
  const [isExpanded, setIsExpanded] = React.useState(isExpandedInitially)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} {...styleProps}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {title}
        </StyledText>
        <Btn
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={
            isExpanded
              ? `CollapsibleSection_collapse_${title}`
              : `CollapsibleSection_expand_${title}`
          }
        >
          <Icon size={'1.5rem'} name={isExpanded ? 'minus' : 'plus'} />
        </Btn>
      </Flex>
      {isExpanded ? children : null}
    </Flex>
  )
}
