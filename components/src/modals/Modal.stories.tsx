import * as React from 'react'
import {
  AlertModal,
  BaseModal,
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

const BaseTemplate: Story<React.ComponentProps<typeof BaseModal>> = args => (
  <BaseModal {...args} />
)
export const Base = BaseTemplate.bind({})
Base.args = {
  header: (
    <Text
      as="h2"
      display={DISPLAY_FLEX}
      alignItems={ALIGN_CENTER}
      fontSize={FONT_SIZE_HEADER}
      fontWeight={FONT_WEIGHT_REGULAR}
    >
      <Icon name="alert" width="1em" marginRight={SPACING_2} />
      Attention
    </Text>
  ),
  children: (
    <>
      <Text marginBottom={SPACING_2}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </Text>
      <Text marginBottom={SPACING_2}>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat.
      </Text>
      <Text>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur
      </Text>
    </>
  ),
  footer: (
    <Flex justifyContent={JUSTIFY_FLEX_END}>
      <SecondaryBtn>OK</SecondaryBtn>
    </Flex>
  ),
}

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
