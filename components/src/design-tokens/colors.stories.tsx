import * as React from 'react'
import { ComponentMeta, ComponentStoryObj } from '@storybook/react'
import { COLORS } from '../ui-style-constants'

import { SPACING } from '../ui-style-constants'
import { DIRECTION_ROW } from '../styles'
import { Flex, Box } from '../primitives'
import { PrimaryButton } from '../atoms/buttons/PrimaryButton'
import './styles/tokens.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Design Tokens/Colors',
} as Meta

export const ALL: ComponentStoryObj<typeof COLORS> = {
  args: {
    category: 'all',
  },
  render: args => <Box {...args} />,
}

// const PrimaryButtonTemplate: Story<
//   React.ComponentProps<typeof PrimaryButton>
// > = args => {
//   const { children } = args
//   return (
//     <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
//       <PrimaryButton>{children}</PrimaryButton>
//       <DesignTokenDocBlock categoryName="Colors" showSearch={false} />
//     </Flex>
//   )
// }

// export const Primary = PrimaryButtonTemplate.bind({})
// Primary.args = {
//   children: 'primary button',
// }
