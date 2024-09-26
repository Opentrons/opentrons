import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
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
              <LegacyStyledText
                as="h3"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {'About Calibration'}
              </LegacyStyledText>

              <LegacyStyledText as="p">
                {'This section is about calibration.'}
              </LegacyStyledText>
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
              <LegacyStyledText
                as="h3"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {'Deck Calibration'}
              </LegacyStyledText>
              <LegacyStyledText as="p">
                {'This section is for deck calibration.'}
              </LegacyStyledText>
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
