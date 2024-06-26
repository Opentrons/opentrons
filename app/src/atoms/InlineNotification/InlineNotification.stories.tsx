import * as React from 'react'
import { VIEWPORT } from '@opentrons/components'
import { InlineNotification } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/InlineNotification',
  argTypes: {
    hug: {
      control: {
        type: 'boolean',
      },
      defaultValue: false,
    },
    type: {
      options: ['alert', 'error', 'neutral', 'success'],
      control: {
        type: 'select',
      },
      defaultValue: 'success',
    },
    onCloseClick: {
      control: {
        type: 'boolean',
      },
      defaultValue: true,
    },
    hasMessage: {
      control: {
        type: 'boolean',
      },
      defaultValue: true,
    },
    message: {
      control: {
        type: 'text',
      },
      if: { arg: 'hasMessage' },
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

export interface WrapperProps extends React.ComponentProps<InlineNotification> {
  hasMessage: boolean
}

function Wrapper(props: WrapperProps): JSX.Element {
  return (
    <InlineNotification
      {...props}
      onCloseClick={
        props.onCloseClick
          ? () => {
              console.log('Close clicked')
            }
          : undefined
      }
      message={props.hasMessage ? props.message : undefined}
    />
  )
}

const Template: Story<React.ComponentProps<typeof Wrapper>> = args => (
  <Wrapper {...args} />
)

export const InlineNotificationComponent = Template.bind({})
InlineNotificationComponent.args = {
  heading: 'awesome',
  message: 'you did it',
  type: 'success',
  hasMessage: true,
}
