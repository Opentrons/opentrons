import * as React from 'react'

import { StyledText } from '@opentrons/components'
import { InterventionModal as InterventionModalComponent } from './'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/InterventionModal',
  component: InterventionModalComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InterventionModalComponent>
> = args => <InterventionModalComponent {...args} />

export const ErrorIntervention = Template.bind({})
ErrorIntervention.args = {
  robotName: 'Otie',
  type: 'error',
  heading: <StyledText as="h3">Oh no, an error!</StyledText>,
  iconName: 'alert-circle',
  children: <StyledText as="p">Here's some error content</StyledText>,
}

export const InterventionRequiredIntervention = Template.bind({})
InterventionRequiredIntervention.args = {
  robotName: 'Otie',
  type: 'intervention-required',
  heading: <StyledText as="h3">Looks like there's something to do</StyledText>,
  children: <StyledText as="p">You've got to intervene!</StyledText>,
}
