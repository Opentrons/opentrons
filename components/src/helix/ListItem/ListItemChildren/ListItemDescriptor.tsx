import { Flex } from '../../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
} from '../../../styles'
import { SPACING } from '../../../ui-style-constants'

import type { ReactNode } from 'react'

interface ListItemDescriptorProps {
  /** ListItemDescriptor size type */
  type: 'default' | 'large'
  /** ListItemDescriptor description */
  description: JSX.Element
  /** ListItemDescriptor content */
  content: JSX.Element
  /** ListItemDescriptor flex direction */
  changeFlexDirection?: boolean
}

export const ListItemDescriptor = (
  props: ListItemDescriptorProps
): ReactNode => {
  const { description, content, type, changeFlexDirection = false } = props
  let justifyContent = 'none'
  if (type === 'default' && changeFlexDirection) {
    justifyContent = JUSTIFY_FLEX_START
  } else if (type === 'default') {
    justifyContent = JUSTIFY_SPACE_BETWEEN
  }

  return (
    <Flex
      flexDirection={changeFlexDirection ? DIRECTION_COLUMN : DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      width="100%"
      alignItems={ALIGN_CENTER}
      justifyContent={justifyContent}
      padding={type === 'default' ? SPACING.spacing4 : SPACING.spacing12}
    >
      {description}
      {content}
    </Flex>
  )
}
