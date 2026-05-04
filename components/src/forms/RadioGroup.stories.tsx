import * as React from 'react'

import { Box, SIZE_6 } from '@opentrons/components'

import { RadioGroup as RadioGroupComponent } from './RadioGroup'

import type { Meta, StoryFn } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Radio Group',
} as Meta

const OPTIONS = [
  { name: 'Hazelnut', value: 'hazelnut' },
  { name: 'Chocolate', value: 'chocolate' },
  { name: 'Ginger', value: 'ginger' },
]

const Template: StoryFn<React.ComponentProps<typeof RadioGroupComponent>> = ({
  value,
  onChange,
  ...args
}) => {
  const firstOptionValue: string =
    args.options != null && args.options.length > 0 && args.options[0] != null
      ? args.options[0].value
      : ''
  const [controlledValue, setControlledValue] =
    React.useState<string>(firstOptionValue)
  return (
    <Box width={SIZE_6}>
      <RadioGroupComponent
        {...args}
        value={controlledValue}
        onChange={e => {
          setControlledValue(
            'value' in e.target ? (e.target.value as string) : ''
          )
        }}
      />
    </Box>
  )
}
export const RadioGroup = Template.bind({})
RadioGroup.args = {
  options: OPTIONS,
  inline: false,
}
