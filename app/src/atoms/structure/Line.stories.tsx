import * as React from 'react'
import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Line as LineComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LineComponent> = {
  title: 'App/Atoms/Line',
  component: LineComponent,
  decorators: [
    Story => (
      <>
        <Box paddingBottom={SPACING.spacing24}>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Box marginRight={SPACING.spacing32}>
              <Box marginBottom={SPACING.spacing8}>
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {'About Calibration'}
                </StyledText>
              </Box>
              <StyledText as="p" marginBottom={SPACING.spacing8}>
                {'This section is about calibration.'}
              </StyledText>
            </Box>
          </Flex>
        </Box>
        <Story />
        <Box paddingTop={SPACING.spacing24} paddingBottom={SPACING.spacing24}>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Box marginRight={SPACING.spacing32}>
              <Box marginBottom={SPACING.spacing8}>
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {'Deck Calibration'}
                </StyledText>
              </Box>
              <StyledText as="p" marginBottom={SPACING.spacing8}>
                {'This section is for deck calibration.'}
              </StyledText>
            </Box>
          </Flex>
        </Box>
      </>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof LineComponent>

export const Line: Story = {}
