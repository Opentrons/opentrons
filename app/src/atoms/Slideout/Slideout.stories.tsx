import * as React from 'react'
import { TYPOGRAPHY, PrimaryBtn, LEGACY_COLORS,
  COLORS, SPACING } from '@opentrons/components'
import { Slideout } from './index'
import { StyledText } from '../text'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Slideout',
  component: Slideout,
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof Slideout>> = args => (
  <Slideout {...args} />
)

const Children = (
  <React.Fragment>
    <StyledText
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING.spacing4}
    >
      {'this is where the slideout body goes'}
    </StyledText>

    <PrimaryBtn
      backgroundColor={LEGACY_COLORS.blueEnabled}
      marginTop="28rem"
      textTransform={TYPOGRAPHY.textTransformNone}
    >
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
      >
        {'btn text'}
      </StyledText>
    </PrimaryBtn>
  </React.Fragment>
)

export const Primary = Template.bind({})
Primary.args = {
  title: 'This is the slideout title with the max width',
  children: Children,
  isExpanded: 'true',
}
