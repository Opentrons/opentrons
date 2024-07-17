import * as React from 'react'

import { Box, RESPONSIVENESS } from '@opentrons/components'

import { OneColumn as OneColumnComponent } from './'
import { StandIn } from './story-utils/StandIn'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<OneColumnComponent>> = {
  title: 'App/Molecules/InterventionModal/OneColumn',
  component: OneColumnComponent,
  render: args => (
    <Box
      css={`
        width: 500;
        @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
          width: 500;
        }
      `}
    >
      <OneColumnComponent>
        <StandIn>This is a standin for another component</StandIn>
      </OneColumnComponent>
    </Box>
  ),
}

export default meta

export type Story = StoryObj<OneColumnComponent>

export const ExampleOneColumn: Story = { args: {} }
