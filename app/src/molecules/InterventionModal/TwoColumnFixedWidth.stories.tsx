import * as React from 'react'

import SuccessIcon from '../../assets/images/icon_success.png'

import { StyledText, Flex, DIRECTION_COLUMN, Box } from '@opentrons/components'
import { InlineNotification } from '../../atoms/InlineNotification'

import { TwoColumnFixedWidth as TwoColumnFixedWidthComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

interface StorybookArgs {
  freeText: string
  imageUrl: string[]
  notificationHeader: string
  notificationBody: string
  notificationType: 'alert' | 'error' | 'neutral'
}

const meta: Meta<
  React.ComponentProps<TwoColumnFixedWidthComponent> & StorybookArgs
> = {
  title: 'App/Molecules/InterventionModal/TwoColumnFixedWidth',
  component: TwoColumnFixedWidthComponent,
  render: args => (
    <Box width={'960px'} height={'432px'} borderWidth={'8px'}>
      <TwoColumnFixedWidthComponent>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText>{args.freeText}</StyledText>
          <InlineNotification
            type={args.notificationType}
            heading={args.notificationHeader}
            message={args.notificationBody}
          />
        </Flex>
        <img
          src={new URL(args.imageUrl[0], import.meta.url).href}
          width={'100%'}
        />
      </TwoColumnFixedWidthComponent>
    </Box>
  ),
  argTypes: {
    freeText: {
      control: {
        type: 'text',
      },
    },
    imageUrl: {
      control: {
        type: 'file',
        accept: '.png',
      },
    },
    notificationHeader: {
      control: {
        type: 'text',
      },
    },
    notificationBody: {
      control: {
        type: 'text',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof TwoColumnFixedWidthComponent>

export const ExampleTwoColumnFixedWidth: Story = {
  args: {
    freeText:
      'Hello here is some text you can type a lot with even multiple lines',
    notificationHeader: 'Oh no',
    notificationBody: 'Theres a notification',
    notificationType: 'alert',
    imageUrl: [SuccessIcon],
  },
}
