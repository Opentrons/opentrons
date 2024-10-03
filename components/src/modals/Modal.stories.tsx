import type * as React from 'react'

import { LegacyStyledText } from '../atoms'
import { SPACING, TYPOGRAPHY } from '../ui-style-constants'
import { PrimaryBtn } from '../primitives'
import { COLORS } from '../helix-design-system'
import { Modal } from './Modal'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/modals/Modal',
  component: Modal,
} as Meta

const Template: Story<React.ComponentProps<typeof Modal>> = args => (
  <Modal {...args} />
)

const Children = (
  <>
    <LegacyStyledText
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      fontSize={TYPOGRAPHY.fontSizeP}
      paddingTop={SPACING.spacing4}
    >
      {'Modal body goes here'}
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
  </>
)

export const Primary = Template.bind({})
Primary.args = {
  type: 'info',
  onClose: () => {},
  closeOnOutsideClick: false,
  title: 'Modal Title',
  children: Children,
}
