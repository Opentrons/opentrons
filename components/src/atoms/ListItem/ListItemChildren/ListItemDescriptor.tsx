import { Flex } from '../../../primitives'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '../../../styles'
import { SPACING } from '../../../ui-style-constants'

interface ListItemDescriptorProps {
  type: 'default' | 'large'
  description: JSX.Element
  content: JSX.Element
}

export const ListItemDescriptor = (
  props: ListItemDescriptorProps
): JSX.Element => {
  const { description, content, type } = props
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      width="100%"
      alignItems={ALIGN_FLEX_START}
      justifyContent={type === 'default' ? JUSTIFY_SPACE_BETWEEN : 'none'}
      padding={type === 'default' ? SPACING.spacing4 : SPACING.spacing12}
    >
      {description}
      {content}
    </Flex>
  )
}
