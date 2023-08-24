import * as React from 'react'
import { customViewports } from '../../../../.storybook/preview'
import { InlineNotification } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/InlineNotification',
  argTypes: {
    hug: {
      control: {
        type: 'boolean',
      },
      defaultValue: false,
    },
    type: {
      control: {
        type: 'select',
        options: ['alert', 'error', 'neutral', 'success'],
      },
      defaultValue: 'success',
    },
    onCloseClick: {
      control: {
        type: 'boolean',
      },
      defaultValue: true,
    },
  },
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
  },
} as Meta

const Template: Story<
  React.ComponentProps<typeof InlineNotification>
> = args => <InlineNotification {...args} />

export const InlineNotificationComponent = Template.bind({})
InlineNotificationComponent.args = {
  heading: 'awesome',
  message: 'you did it',
  type: 'success',
}
