import * as React from 'react'

import { LegacyModal } from './index'
import { StyledText } from '../../atoms/text'

import type { Story, Meta } from '@storybook/react'
import { COLORS, PrimaryBtn, SPACING, TYPOGRAPHY } from '@opentrons/components'

export default {
  title: 'App/Molecules/LegacyModal',
  component: LegacyModal,
} as Meta

const Template: Story<React.ComponentProps<typeof LegacyModal>> = args => (
  <LegacyModal {...args} />
)

const Children = (
  <React.Fragment>
    <StyledText
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING.spacing4}
    >
      {'LegacyModal body goes here'}
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
  type: 'info',
  onClose: () => {},
  closeOnOutsideClick: false,
  title: 'Modal Title',
  children: Children,
}
