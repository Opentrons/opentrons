import * as React from 'react'
import {
  Box,
  Flex,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
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
    <Box paddingBottom={SPACING.spacing5}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box marginRight={SPACING.spacing6}>
          <Box marginBottom={SPACING.spacing3}>
            <StyledText as="h3SemiBold">{'About Calibration'}</StyledText>
          </Box>
          <StyledText as="p" marginBottom={SPACING.spacing3}>
            {'This section is about calibration.'}
          </StyledText>
        </Box>
      </Flex>
    </Box>
    <Divider {...args} />
    <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box marginRight={SPACING.spacing6}>
          <Box marginBottom={SPACING.spacing3}>
            <StyledText as="h3SemiBold">{'Deck Calibration'}</StyledText>
          </Box>
          <StyledText as="p" marginBottom={SPACING.spacing3}>
            {'This section is for deck calibration.'}
          </StyledText>
        </Box>
      </Flex>
    </Box>
  </>
)

export const Primary = Template.bind({})
Primary.args = {
  marginY: SPACING.spacing4,
}
