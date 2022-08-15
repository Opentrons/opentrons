import * as React from 'react'

import { Modal } from './index'
import { StyledText } from '../../atoms/text'

import type { Story, Meta } from '@storybook/react'
import { COLORS, PrimaryBtn, SPACING, TYPOGRAPHY } from '@opentrons/components'

export default {
  title: 'App/Molecules/Modal',
  component: Modal,
} as Meta

const Template: Story<React.ComponentProps<typeof Modal>> = args => (
  <Modal {...args} />
)

const Children = (
  <React.Fragment>
    <StyledText
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING.spacing2}
    >
      {'Modal body goes here'}
    </StyledText>

    <PrimaryBtn
      backgroundColor={COLORS.blue}
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
