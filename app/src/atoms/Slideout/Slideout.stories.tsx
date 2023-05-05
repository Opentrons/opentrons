import * as React from 'react'
import { TYPOGRAPHY, PrimaryBtn, COLORS, SPACING } from '@opentrons/components'
import type { Story, Meta } from '@storybook/react'

import { StyledText } from '../text'
import { Slideout } from './index'

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
      paddingTop={SPACING.spacing2}
    >
      {'this is where the slideout body goes'}
    </StyledText>

    <PrimaryBtn
      backgroundColor={COLORS.blueEnabled}
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
