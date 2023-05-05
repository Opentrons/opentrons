import * as React from 'react'
import type { Story, Meta } from '@storybook/react'

import { InterventionModal as InterventionModalComponent } from './'

export default {
  title: 'App/Organisms/InterventionModal',
  component: InterventionModalComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InterventionModalComponent>
> = args => <InterventionModalComponent {...args} />

export const BasicExample = Template.bind({})
BasicExample.args = {
  robotName: 'Otie',
}
