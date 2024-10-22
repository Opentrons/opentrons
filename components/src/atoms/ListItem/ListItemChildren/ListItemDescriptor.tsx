import { Flex } from '../../../primitives'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  // FLEX_AUTO,
  JUSTIFY_SPACE_BETWEEN,
} from '../../../styles'
import { SPACING } from '../../../ui-style-constants'

interface ListItemDescriptorProps {
  type: 'default' | 'mini'
  paddingType: 'default' | 'large'
  description: JSX.Element | string
  content: JSX.Element | string
}

export const ListItemDescriptor = (
  props: ListItemDescriptorProps
): JSX.Element => {
  const { description, content, type, paddingType } = props
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      width="100%"
      alignItems={ALIGN_FLEX_START}
      justifyContent={type === 'mini' ? JUSTIFY_SPACE_BETWEEN : 'none'}
      padding={paddingType === 'default' ? SPACING.spacing4 : SPACING.spacing12}
    >
      <Flex
        // flex={type === 'default' && '1'}
        // width={type === 'mini' ? FLEX_AUTO : '40%'}
        // width="13.75rem"
        minWidth="13.75rem"
      >
        {description}
      </Flex>
      <Flex width="100%">{content}</Flex>
    </Flex>
  )
}
