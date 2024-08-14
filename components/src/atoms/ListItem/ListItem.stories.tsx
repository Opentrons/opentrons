import * as React from 'react'

import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { DIRECTION_COLUMN } from '../../styles'
import { Flex } from '../../primitives'
import { LegacyStyledText } from '../StyledText'
import { ListItemDescriptor, ListItemCustomize } from './ListItemChildren'
import { ListItem as ListItemComponent } from './index'
import sampleImg from '../../images/labware/measurement-guide/images/depth/depth-plate-v@3x.png'

import type { Meta, StoryObj } from '@storybook/react'
import type { DropdownMenuProps } from '../../molecules'

const meta: Meta<typeof ListItemComponent> = {
  title: 'Library/Atoms/ListItem',
  component: ListItemComponent,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['error', 'noActive', 'success', 'warning'],
      },
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof ListItemComponent>

export const ListItem: Story = {
  args: {
    type: 'noActive',
    children: (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
      </Flex>
    ),
  },
}

export const ListItemDescriptorDefault: Story = {
  args: {
    type: 'noActive',
    children: (
      <ListItemDescriptor
        type="default"
        content={<div>mock content</div>}
        description={<div>mock description</div>}
      />
    ),
  },
}

export const ListItemDescriptorMini: Story = {
  args: {
    type: 'noActive',
    children: (
      <ListItemDescriptor
        type="mini"
        content={<div>mock content</div>}
        description={<div>mock description</div>}
      />
    ),
  },
}

const exampleDropDown: DropdownMenuProps = {
  dropdownType: 'neutral',
  onClick: () => {},
  currentOption: { name: 'option 1', value: '1' },
  filterOptions: [
    { name: 'option 1', value: '1' },
    { name: 'option 2', value: '2' },
  ],
}

export const ListItemCustomizeDefault: Story = {
  args: {
    type: 'noActive',
    children: (
      <ListItemCustomize
        header="Header"
        onClick={() => {}}
        dropdown={exampleDropDown}
        label="Label"
        image={<img src={sampleImg} height="60px" width="60px" />}
        linkText="Text"
      />
    ),
  },
}
