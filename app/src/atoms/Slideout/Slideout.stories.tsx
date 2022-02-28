import * as React from 'react'
import {
  Text,
  TYPOGRAPHY,
  SPACING_1,
  C_BLUE,
  PrimaryBtn,
  TEXT_TRANSFORM_NONE,
  FONT_WEIGHT_REGULAR,
} from '@opentrons/components'
import { Slideout } from './index'

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
    <Text
      fontWeight={600}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING_1}
    >
      {'this is where the slideout body goes'}
    </Text>

    <PrimaryBtn
      backgroundColor={C_BLUE}
      marginTop={'28rem'}
      textTransform={TEXT_TRANSFORM_NONE}
    >
      <Text fontWeight={FONT_WEIGHT_REGULAR} fontSize="0.6875rem">
        {'btn text'}
      </Text>
    </PrimaryBtn>
  </React.Fragment>
)

export const Primary = Template.bind({})
Primary.args = {
  title: 'This is the slideout title with the max width',
  children: Children,
  isExpanded: 'true',
}
