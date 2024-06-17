import * as React from 'react'

import { StyledText, Box, BORDERS } from '@opentrons/components'

import { OneColumn as OneColumnComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

function StandInContent(): JSX.Element {
  return (
    <Box
      border={'4px dashed #A864FFFF'}
      borderRadius={BORDERS.borderRadius8}
      margin={SPACING.spacing16}
      height="104px"
      backgroundColor="#A864FF19"
    >
      <StyledText as="p">This is a standin for some other component</StyledText>
    </Box>
  )
}

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
        <StandInContent />
      </OneColumnComponent>
    </Box>
  ),
}

export default meta

export type Story = StoryObj<OneColumnComponent>

export const ExampleOneColumn: Story = { args: {} }
