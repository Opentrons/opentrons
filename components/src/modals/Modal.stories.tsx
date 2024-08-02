import * as React from 'react'
import {
  AlertModal,
  ContinueModal,
  Overlay,
  SpinnerModal,
  SpinnerModalPage,
} from './'
import {
  Box,
  Text,
  Flex,
  SecondaryBtn,
  Icon,
  JUSTIFY_FLEX_END,
  DISPLAY_FLEX,
  ALIGN_CENTER,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_REGULAR,
  SPACING_2,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Modal',
  decorators: [
    Story => (
      <Box width="32rem" height="16rem">
        <Story />
      </Box>
    ),
  ],
} as Meta

const AlertTemplate: Story<React.ComponentProps<typeof AlertModal>> = args => (
  <AlertModal {...args} />
)
export const Alert = AlertTemplate.bind({})
Alert.args = {
  children:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  heading: 'heading',
  alertOverlay: true,
  buttons: [{ children: 'foo' }],
}

const ContinueTemplate: Story<
  React.ComponentProps<typeof ContinueModal>
> = args => <ContinueModal {...args} />
export const Continue = ContinueTemplate.bind({})
Continue.args = {
  children:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  heading: 'heading',
}

const SpinnerTemplate: Story<
  React.ComponentProps<typeof SpinnerModal>
> = args => <SpinnerModal {...args} />
export const Spinner = SpinnerTemplate.bind({})

const SpinnerPageTemplate: Story<
  React.ComponentProps<typeof SpinnerModalPage>
> = args => <SpinnerModalPage {...args} />
export const SpinnerPage = SpinnerPageTemplate.bind({})

const OverlayTemplate: Story<React.ComponentProps<typeof Overlay>> = args => (
  <Overlay {...args} />
)
export const JustOverlay = OverlayTemplate.bind({})
