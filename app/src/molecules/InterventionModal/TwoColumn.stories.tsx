import * as React from 'react'

import SuccessIcon from '../../assets/images/icon_success.png'

import { StyledText, Flex, DIRECTION_COLUMN, Box } from '@opentrons/components'
import { InlineNotification } from '../../atoms/InlineNotification'

import { TwoColumn as TwoColumnComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

interface StorybookArgs {
  freeText: string
  imageUrl: string[]
  notificationHeader: string
  notificationBody: string
  notificationType: 'alert' | 'error' | 'neutral'
  containerWidth: number
  containerHeight: number
}

const meta: Meta<React.ComponentProps<TwoColumnComponent> & StorybookArgs> = {
  title: 'App/Molecules/InterventionModal/TwoColumn',
  component: TwoColumnComponent,
  render: args => (
    <Box
      width={`${args.containerWidth}px`}
      height={`${args.containerHeight}px`}
      borderWidth={'8px'}
    >
      <TwoColumnComponent>
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
      </TwoColumnComponent>
    </Box>
  ),
  argTypes: {
    containerHeight: {
      control: {
        type: 'number',
      },
      default: 432,
    },
    containerWidth: {
      control: {
        type: 'number',
      },
      default: 960,
    },
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

type Story = StoryObj<typeof TwoColumnComponent>

export const ExampleTwoColumn: Story = {
  args: {
    freeText:
      'Hello here is some text you can type a lot with even multiple lines',
    notificationHeader: 'Oh no',
    notificationBody: 'Theres a notification',
    notificationType: 'alert',
    imageUrl: [SuccessIcon],
    containerWidth: 960,
    containerHeight: 432,
  },
}
