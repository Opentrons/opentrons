import { Fragment } from 'react'
import { action } from 'storybook/actions'

import {
  COLORS,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Slideout as SlideoutComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SlideoutComponent> = {
  title: 'App/Atoms/Slideout',
  component: SlideoutComponent,
  args: {
    onCloseClick: action('clicked'),
  },
}

export default meta

type Story = StoryObj<typeof SlideoutComponent>

const Children = (
  <Fragment>
    <StyledText
      desktopStyle="bodyDefaultSemiBold"
      paddingTop={SPACING.spacing4}
    >
      {'this is where the slideout body goes'}
    </StyledText>

    <PrimaryButton
      backgroundColor={COLORS.blue50}
      marginTop="28rem"
      textTransform={TYPOGRAPHY.textTransformNone}
    >
      <StyledText desktopStyle="bodyDefaultRegular">{'btn text'}</StyledText>
    </PrimaryButton>
  </Fragment>
)

export const Slideout: Story = {
  args: {
    title: 'This is the slideout title with the max width',
    children: Children,
    isExpanded: true,
  },
}
