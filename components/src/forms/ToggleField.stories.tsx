import * as React from 'react'

import { ToggleField as ToggleFieldComponent } from './ToggleField'

import type { Story, Meta } from '@storybook/react'

const Template: Story<
  React.ComponentProps<typeof ToggleFieldComponent>
> = args => {
  const [isOn, setIsOn] = React.useState<boolean>(false)
  return (
    <ToggleFieldComponent
      {...args}
      onChange={e => {
        setIsOn(!isOn)
        args.onChange(e)
      }}
      value={isOn}
    />
  )
}

export const ToggleField = Template.bind({})
ToggleField.args = {
  label: 'Toggle Me',
}

export default {
  title: 'Library/Molecules/Forms/Toggle Field',
  component: ToggleField,
} as Meta
