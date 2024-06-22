import * as React from 'react'

import {
  LegacyStyledText,
  Box,
  Flex,
  BORDERS,
  RESPONSIVENESS,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { OneColumn as OneColumnComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

function StandInContent(): JSX.Element {
  return (
    <Flex
      border={'4px dashed #A864FFFF'}
      borderRadius={BORDERS.borderRadius8}
      margin={SPACING.spacing16}
      height="104px"
      backgroundColor="#A864FF19"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <LegacyStyledText as="h1">
        This is a standin for some other component
      </LegacyStyledText>
    </Flex>
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
