import { Flex } from '../../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  FLEX_AUTO,
  JUSTIFY_SPACE_BETWEEN,
} from '../../../styles'
import { SPACING } from '../../../ui-style-constants'

interface ListItemDescriptorProps {
  type: 'default' | 'mini'
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
      alignItems={ALIGN_CENTER}
      justifyContent={type === 'mini' ? JUSTIFY_SPACE_BETWEEN : 'none'}
      padding={
        type === 'mini'
          ? `${SPACING.spacing4} ${SPACING.spacing8}`
          : SPACING.spacing12
      }
    >
      <Flex
        flex={type === 'default' && '1'}
        width={type === 'mini' ? FLEX_AUTO : '40%'}
      >
        {description}
      </Flex>
      <Flex flex={type === 'default' && '1.95'} overflowWrap="anywhere">
        {content}
      </Flex>
    </Flex>
  )
}
