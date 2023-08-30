import * as React from 'react'
import { StyledText } from './index'
import type { Story, Meta } from '@storybook/react'
import { TYPOGRAPHY } from '@opentrons/components'

export default {
  title: 'App/Atoms/StyledText',
  component: StyledText,
} as Meta

const Template: Story<React.ComponentProps<typeof StyledText>> = args => (
  <StyledText {...args} />
)

const dummyText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus sapien nunc dolor, aliquet nibh placerat et nisl, arcu. Pellentesque blandit sollicitudin vitae morbi morbi vulputate cursus tellus. Amet proin donec proin id aliquet in nullam.'

export const h1 = Template.bind({})
h1.args = {
  as: 'h1',
  children: dummyText,
}

export const h2 = Template.bind({})
h2.args = {
  as: 'h2',
  children: dummyText,
}

export const h3 = Template.bind({})
h3.args = {
  as: 'h3',
  children: dummyText,
}

export const h6 = Template.bind({})
h6.args = {
  as: 'h6',
  children: dummyText,
}

export const p = Template.bind({})
p.args = {
  as: 'p',
  children: dummyText,
}

export const label = Template.bind({})
label.args = {
  as: 'label',
  children: dummyText,
}

export const h2SemiBold = Template.bind({})
h2SemiBold.args = {
  as: 'h2',
  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  children: dummyText,
}

export const h3SemiBold = Template.bind({})
h3SemiBold.args = {
  as: 'h3',
  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  children: dummyText,
}

export const h6SemiBold = Template.bind({})
h6SemiBold.args = {
  as: 'h6',
  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  children: dummyText,
}

export const pSemiBold = Template.bind({})
pSemiBold.args = {
  as: 'p',
  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  children: dummyText,
}

export const labelSemiBold = Template.bind({})
labelSemiBold.args = {
  as: 'label',
  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  children: dummyText,
}
