import * as React from 'react'
import { Box, SIZE_6 } from '@opentrons/components'

import { RadioGroup as RadioGroupComponent } from './RadioGroup'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Radio Group',
} as Meta

const OPTIONS = [
  { name: 'Hazelnut', value: 'hazelnut' },
  { name: 'Chocolate', value: 'chocolate' },
  { name: 'Ginger', value: 'ginger' },
]

const Template: Story<React.ComponentProps<typeof RadioGroupComponent>> = ({
  value,
  onChange,
  ...args
}) => {
  const [controlledValue, setControlledValue] = React.useState(
    args.options[0].value
  )
  return (
    <Box width={SIZE_6}>
      <RadioGroupComponent
        {...args}
        value={controlledValue}
        onChange={e => setControlledValue(e.target.value)}
      />
    </Box>
  )
}
export const RadioGroup = Template.bind({})
RadioGroup.args = {
  options: OPTIONS,
  inline: false,
}
