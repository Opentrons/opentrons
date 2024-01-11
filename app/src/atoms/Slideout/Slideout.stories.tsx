import * as React from 'react'
import { TYPOGRAPHY, PrimaryBtn, COLORS, SPACING } from '@opentrons/components'
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
<<<<<<< HEAD
      backgroundColor={COLORS.blue50}
=======
      backgroundColor={COLORS.blueEnabled}
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
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
