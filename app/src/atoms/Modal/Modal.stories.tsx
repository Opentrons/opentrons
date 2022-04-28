import * as React from 'react'
import { Modal } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Modal',
  component: Modal,
} as Meta

const Template: Story<React.ComponentProps<typeof Modal>> = args => (
  <Modal {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  type: 'info',
  title: 'This is the title',
  children: 'this is the body',
  footer: 'this is a footer',
}
