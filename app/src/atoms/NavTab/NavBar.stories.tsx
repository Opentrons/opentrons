import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { NavTab } from './'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/NavTab',
  component: NavTab,
} as Meta

const Template: Story<React.ComponentProps<typeof NavTab>> = args => (
  <MemoryRouter initialEntries={['']} initialIndex={0}>
    <NavTab {...args} />
  </MemoryRouter>
)

export const Primary = Template.bind({})
Primary.args = {
  tabName: 'tab 1',
  to: 'route',
}
