import { MenuItem } from './MenuItem'
import { MenuList } from './index'
import type { Story, Meta } from '@storybook/react'
import * as React from 'react'

export default {
  title: 'App/Atoms/MenuList',
  component: MenuList,
  onClick: { action: 'clicked' },
} as Meta

const Template: Story<React.ComponentProps<typeof MenuList>> = args => (
  <MenuList {...args} />
)

const menuBtn = 'example menu btn'
export const Primary = Template.bind({})
Primary.args = {
  children: (
    <>
      <MenuItem>{menuBtn}</MenuItem>
      <MenuItem>{menuBtn}</MenuItem>
      <MenuItem>{menuBtn}</MenuItem>
    </>
  ),
}
