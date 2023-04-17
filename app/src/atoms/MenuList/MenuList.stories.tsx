import * as React from 'react'
import { MenuList } from './index'
import { MenuItem } from './MenuItem'

import type { Story, Meta } from '@storybook/react'

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

export const IsOnDevice = Template.bind({})
IsOnDevice.args = {
  isOnDevice: true,
  children: (
    <>
      <MenuItem isOnDevice={true}>{menuBtn}</MenuItem>
      <MenuItem isOnDevice={true}>{menuBtn}</MenuItem>
      <MenuItem isOnDevice={true} isAlert={true}>
        {menuBtn}
      </MenuItem>
    </>
  ),
}
