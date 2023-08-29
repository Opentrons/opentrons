import * as React from 'react'

import { Flex, SPACING } from '@opentrons/components'
import { ICON_DATA_BY_NAME } from '@opentrons/components/src/icons/icon-data'

import { GlobalStyle } from '../../../../app/src/atoms/GlobalStyle'
import { customViewports } from '../../../../.storybook/preview'
import { LocationIcon } from '.'

import type { Story, Meta } from '@storybook/react'

const slots = [
  'A1',
  'A2',
  'A3',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D1',
  'D2',
  'D3',
  'D4',
]

export default {
  title: 'ODD/Molecules/LocationIcon',
  argTypes: {
    iconName: {
      control: {
        type: 'select',
        options: Object.keys(ICON_DATA_BY_NAME),
      },
      defaultValue: undefined,
    },
    slotName: {
      control: {
        type: 'select',
        options: slots,
      },
      defaultValue: undefined,
    },
  },
  component: LocationIcon,
  // Note (kk:08/29/2023) this component is located in components so avoid importing const from app
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
  },
  decorators: [
    Story => (
      <>
        <GlobalStyle isOnDevice />
        <Story />
      </>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof LocationIcon>> = args => (
  <Flex marginTop={SPACING.spacing16} width="15rem" height="5rem">
    <LocationIcon {...args} />
  </Flex>
)

export const DisplaySlot = Template.bind({})
DisplaySlot.args = {
  slotName: 'A1',
}

export const DisplayIcon = Template.bind({})
DisplayIcon.args = {
  iconName: 'ot-temperature-v2',
}
