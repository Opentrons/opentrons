import { Flex, SPACING, STYLE_PROPS } from '@opentrons/components'

import { CodeBlock as CodeBlockComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof CodeBlockComponent> = {
  title: 'Helix/Atoms/CodeBlock',
  argTypes: {
    // Disable all StyleProps
    ...Object.fromEntries(
      [...STYLE_PROPS, 'as', 'ref', 'theme', 'forwardedAs'].map(prop => [
        prop,
        { table: { disable: true } },
      ])
    ),
  },
  component: CodeBlockComponent,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16} width="50rem" height="10rem">
        <Story />
      </Flex>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof CodeBlockComponent>

export const CodeBlock: Story = {
  args: {
    children: `import opentrons.executeprotocol = opentrons.execute.get_protocol_api(“2.12”)labware_1 = protocol.load_labware(“opentrons_1_trash_1100ml_fixed”, location”12”)labware_2 = protocol.load_labware(“opentrons_96_tiprack_1000ul”, location“1”)labware_3 = protocol.load_labware(“usascientific_12_reservoir_22ml”, location”2”)`,
  },
}
