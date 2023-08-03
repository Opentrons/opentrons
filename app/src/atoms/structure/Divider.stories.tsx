import * as React from 'react'
import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../text'
import { Divider } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Divider',
  component: Divider,
} as Meta

const Template: Story<React.ComponentProps<typeof Divider>> = args => (
  <>
    <Box paddingBottom={SPACING.spacing24}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
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
    <Divider {...args} />
    <Box paddingTop={SPACING.spacing24} paddingBottom={SPACING.spacing24}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
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
)

export const Primary = Template.bind({})
Primary.args = {
  marginY: SPACING.spacing16,
}
