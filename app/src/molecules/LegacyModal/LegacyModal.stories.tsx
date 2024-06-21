import * as React from 'react'
import {
  COLORS,
  PrimaryBtn,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LegacyModal } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/LegacyModal',
  component: LegacyModal,
} as Meta

const Template: Story<React.ComponentProps<typeof LegacyModal>> = args => (
  <LegacyModal {...args} />
)

const Children = (
  <React.Fragment>
    <LegacyStyledText
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING.spacing4}
    >
      {'LegacyModal body goes here'}
    </LegacyStyledText>

    <PrimaryBtn
      backgroundColor={COLORS.blue50}
      marginTop="28rem"
      textTransform={TYPOGRAPHY.textTransformNone}
    >
      <LegacyStyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
      >
        {'btn text'}
      </LegacyStyledText>
    </PrimaryBtn>
  </React.Fragment>
)

export const Primary = Template.bind({})
Primary.args = {
  type: 'info',
  onClose: () => {},
  closeOnOutsideClick: false,
  title: 'Modal Title',
  children: Children,
}
