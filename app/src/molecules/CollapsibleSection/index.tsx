import { useState } from 'react'
import { css } from 'styled-components'

import {
  Btn,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'

const ACCORDION_STYLE = css`
  border-radius: 50%;
  &:hover {
    background: ${COLORS.grey30};
  }
  &:active {
    background: ${COLORS.grey35};
  }
`

interface CollapsibleSectionProps extends StyleProps {
  title: string
  children: ReactNode
  isExpandedInitially?: boolean
}

export function CollapsibleSection(
  props: CollapsibleSectionProps
): JSX.Element {
  const { title, children, isExpandedInitially = true, ...styleProps } = props
  const [isExpanded, setIsExpanded] = useState(isExpandedInitially)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} {...styleProps}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        css={{
          cursor: CURSOR_POINTER,
        }}
      >
        <LegacyStyledText
          forwardedAs="p"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {title}
        </LegacyStyledText>
        <Btn
          aria-label={title}
          onClick={() => {
            setIsExpanded(!isExpanded)
          }}
        >
          <Icon
            size="1.5rem"
            name={isExpanded ? 'minus' : 'plus'}
            css={ACCORDION_STYLE}
          />
        </Btn>
      </Flex>
      {isExpanded ? children : null}
    </Flex>
  )
}
