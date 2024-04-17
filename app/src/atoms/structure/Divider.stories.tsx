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
import { Divider as DividerComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof DividerComponent> = {
  title: 'App/Atoms/Divider',
  component: DividerComponent,
  decorators: [
    Story => (
      <>
        <Box>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing8}
          >
            <Box padding={SPACING.spacing16}>
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {'About Calibration'}
              </StyledText>

              <StyledText as="p">
                {'This section is about calibration.'}
              </StyledText>
            </Box>
          </Flex>
        </Box>
        <Story />
        <Box>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Box padding={SPACING.spacing16} gridGap={SPACING.spacing8}>
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {'Deck Calibration'}
              </StyledText>
              <StyledText as="p">
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
type Story = StoryObj<typeof DividerComponent>
export const Divider: Story = {}
