import * as React from 'react'
import { ModalPage } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/ModalPage',
  component: ModalPage,
} as Meta

const Template: Story<React.ComponentProps<typeof ModalPage>> = args => (
  <ModalPage {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  titleBar: {
    title: 'title',
    back: {
      onClick: () => jest.fn(),
      title: 'exit',
      children: 'exit',
    },
  },
}
