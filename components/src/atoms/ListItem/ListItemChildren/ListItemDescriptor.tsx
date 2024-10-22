import { Flex } from '../../../primitives'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  // FLEX_AUTO,
  JUSTIFY_SPACE_BETWEEN,
} from '../../../styles'
import { SPACING } from '../../../ui-style-constants'

interface ListItemDescriptorProps {
  type: 'default' | 'large'
  description: JSX.Element | string
  content: JSX.Element | string
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
      <Flex minWidth="13.75rem">{description}</Flex>
      <Flex width="100%">{content}</Flex>
    </Flex>
  )
}
